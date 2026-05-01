// 익스텐션 schema와 호환되는 도메인 타입
// docs/database-design.md / docs/schema.sql 참고

export type WordSource = "OXFORD" | "CAMBRIDGE" | "MERRIAM" | string;

export type Pronunciation = {
  label: string;
  ipa: string;
  audioUrl: string;
};

export type Meaning = {
  order: string;
  definition: string;
  exampleEn?: string;
  exampleKo?: string;
};

export type PartOfSpeech = {
  pos: string;
  meanings: Meaning[];
};

export type RelatedWord = {
  word: string;
  url: string;
};

/**
 * Supabase `words.snapshot` JSONB 의 모양 (extension `parser.parseEntry()` 결과).
 */
export type WordSnapshot = {
  word: string;
  externalUrl?: string;
  source?: string;
  level?: string;
  hasIdiom?: boolean;
  pronunciations: Pronunciation[];
  partsOfSpeech: PartOfSpeech[];
  synonyms: RelatedWord[];
  antonyms: RelatedWord[];
  images: string[];
};

/**
 * Supabase `words` 테이블 행 (간소화).
 */
export type WordRow = {
  id: string;
  lemma: string;
  snapshot: WordSnapshot;
  source: string;
  last_synced_at: string;
  created_at: string;
};

export type WordStatus = "new" | "learning" | "mastered";

/**
 * Supabase `user_words` 테이블 행 (학습 상태).
 */
export type UserWordRow = {
  id: string;
  user_id: string;
  word_id: string;
  folder_id: string | null;

  status: WordStatus;
  srs_due_at: string;
  srs_interval_days: number;
  srs_ease: number;
  review_count: number;
  correct_count: number;

  source_url: string | null;
  context_sentence: string | null;
  note: string | null;
  is_favorite: boolean;

  created_at: string;
  updated_at: string;
};

/**
 * UI 화면용 결합 타입 — words ⨯ user_words.
 */
export type Word = WordRow & {
  user_word?: UserWordRow;
  /** 0..1, srs_ease/interval에서 파생 — 화면 표시용 */
  mastery: number;
};

export type ReviewResult = "again" | "hard" | "good" | "easy";

export type ReviewLogRow = {
  id: string;
  user_word_id: string;
  result: ReviewResult;
  prev_interval_days: number;
  next_interval_days: number;
  reviewed_at: string;
};
