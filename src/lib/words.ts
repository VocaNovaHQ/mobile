import { supabase } from "./supabase";
import { applyReview, computeMastery } from "./srs";
import type {
  ReviewResult,
  UserWordRow,
  Word,
  WordRow,
  WordStatus,
} from "../types/word";

/** words ⨝ user_words → 화면용 Word */
function joinToWord(row: any): Word {
  const word: WordRow = {
    id: row.id,
    lemma: row.lemma,
    snapshot: row.snapshot,
    source: row.source,
    last_synced_at: row.last_synced_at,
    created_at: row.created_at,
  };
  const uw: UserWordRow | undefined = row.user_words?.[0];

  return {
    ...word,
    user_word: uw,
    mastery: uw
      ? computeMastery({
          interval_days: uw.srs_interval_days,
          ease: uw.srs_ease,
          review_count: uw.review_count,
          correct_count: uw.correct_count,
        })
      : 0,
  };
}

/**
 * 사용자가 저장한 모든 단어 (가장 최근에 추가한 순서).
 * RLS 가 자동으로 본인 user_words 만 필터링.
 */
export async function fetchMyWords(opts?: {
  status?: WordStatus | "all";
  isFavorite?: boolean;
  search?: string;
  offset?: number;
  limit?: number;
}): Promise<Word[]> {
  const limit = opts?.limit ?? 200;
  const offset = opts?.offset ?? 0;
  // words!inner: search filter must propagate to parent rows.
  let q = supabase
    .from("user_words")
    .select(
      `
      id, status, srs_due_at, srs_interval_days, srs_ease,
      review_count, correct_count, source_url, context_sentence, note,
      is_favorite, folder_id, user_id, word_id, created_at, updated_at,
      words!inner (
        id, lemma, snapshot, source, last_synced_at, created_at
      )
      `
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.status && opts.status !== "all") {
    q = q.eq("status", opts.status);
  }
  if (opts?.isFavorite === true) {
    q = q.eq("is_favorite", true);
  }
  if (opts?.search) {
    q = q.ilike("words.lemma", `%${opts.search}%`);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.words)
    .map((row: any) => {
      const w = row.words as any;
      return joinToWord({ ...w, user_words: [row] });
    });
}

/** 오늘 복습 가능한 단어 (srs_due_at <= now) */
export async function fetchDueWords(limit = 30): Promise<Word[]> {
  const { data, error } = await supabase
    .from("user_words")
    .select(
      `
      id, status, srs_due_at, srs_interval_days, srs_ease,
      review_count, correct_count, source_url, context_sentence, note,
      is_favorite, folder_id, user_id, word_id, created_at, updated_at,
      words ( id, lemma, snapshot, source, last_synced_at, created_at )
      `
    )
    .lte("srs_due_at", new Date().toISOString())
    .order("srs_due_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? [])
    .filter((row) => row.words)
    .map((row: any) => joinToWord({ ...(row.words as any), user_words: [row] }));
}

/** 단어 한 개 (id 기준) */
export async function fetchWordById(wordId: string): Promise<Word | null> {
  const { data, error } = await supabase
    .from("words")
    .select(
      `
      id, lemma, snapshot, source, last_synced_at, created_at,
      user_words!inner ( * )
      `
    )
    .eq("id", wordId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return joinToWord(data);
}

/** 단어를 단어장에 추가 (익스텐션의 add_word_to_vocab RPC 와 동일) */
export async function addWordToVocab(opts: {
  lemma: string;
  snapshot: any;
  sourceUrl?: string | null;
  contextSentence?: string | null;
}): Promise<{ user_word_id: string; word_id: string; was_new: boolean } | null> {
  const { data, error } = await supabase.rpc("add_word_to_vocab", {
    p_lemma: opts.lemma,
    p_snapshot: opts.snapshot,
    p_source_url: opts.sourceUrl ?? null,
    p_context_sentence: opts.contextSentence ?? null,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
}

/**
 * 한 swipe의 결과 — commit_review_session 호출용 페이로드.
 * 클라이언트가 메모리에 누적했다가 세션 끝에 한 번에 RPC로 보냄.
 */
export type PendingReview = {
  user_word_id: string;
  result: ReviewResult;
  prev_interval_days: number;
  next_interval_days: number;
  srs_ease: number;
  review_count: number;
  correct_count: number;
  status: WordStatus;
  srs_due_at: string;
};

/**
 * 단일 swipe → PendingReview 변환 헬퍼.
 * applyReview 결과를 RPC 인자 형태로 묶음.
 */
export function buildPendingReview(
  userWord: UserWordRow,
  result: ReviewResult
): PendingReview {
  const transition = applyReview(
    {
      interval_days: userWord.srs_interval_days,
      ease: userWord.srs_ease,
      review_count: userWord.review_count,
      correct_count: userWord.correct_count,
    },
    result
  );
  return {
    user_word_id: userWord.id,
    result,
    prev_interval_days: userWord.srs_interval_days,
    next_interval_days: transition.next.interval_days,
    srs_ease: transition.next.ease,
    review_count: transition.next.review_count,
    correct_count: transition.next.correct_count,
    status: transition.status,
    srs_due_at: transition.due_at.toISOString(),
  };
}

export type SessionCommitResult = {
  current_streak: number;
  longest_streak: number;
  today_reviews: number;
  reviews_committed: number;
};

/**
 * 학습 세션 종료 시 단일 RPC 호출.
 * - review_logs bulk insert
 * - user_words SRS 갱신
 * - daily_activity / user_stats / streak 일괄 갱신
 */
export async function commitReviewSession(
  reviews: PendingReview[]
): Promise<SessionCommitResult | null> {
  if (reviews.length === 0) return null;
  const { data, error } = await supabase.rpc("commit_review_session", {
    p_reviews: reviews,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    current_streak: row.current_streak ?? 0,
    longest_streak: row.longest_streak ?? 0,
    today_reviews: row.today_reviews ?? 0,
    reviews_committed: row.reviews_committed ?? reviews.length,
  };
}

export async function setWordNote(userWordId: string, note: string | null) {
  const { error } = await supabase
    .from("user_words")
    .update({ note })
    .eq("id", userWordId);
  if (error) throw error;
}

export async function setWordFavorite(userWordId: string, isFavorite: boolean) {
  const { error } = await supabase
    .from("user_words")
    .update({ is_favorite: isFavorite })
    .eq("id", userWordId);
  if (error) throw error;
}

export async function deleteUserWord(userWordId: string) {
  const { error } = await supabase
    .from("user_words")
    .delete()
    .eq("id", userWordId);
  if (error) throw error;
}
