import { supabase } from "./supabase";
import type { WordStatus } from "../types/word";

export type StatusCounts = Record<WordStatus, number>;

export type DailyCount = {
  /** YYYY-MM-DD (KST 기준) */
  date: string;
  count: number;
};

export type StatsSummary = {
  total: number;
  byStatus: StatusCounts;
  addedThisWeek: number;
  thisWeekReviews: number;
  todayReviews: number;
  /** 오늘 KST 기준 연속 학습일 수 */
  streak: number;
  /** 최장 streak */
  longestStreak: number;
  /** 최근 14일, 오래된 → 최신 순 (KST) */
  daily: DailyCount[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** UTC Date → KST 기준 YYYY-MM-DD */
export function kstDateKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return kst.toISOString().slice(0, 10);
}

/** KST 자정 기준의 오늘 날짜 키 */
export function kstTodayKey(): string {
  return kstDateKey(new Date());
}

/**
 * 통계 화면용 요약 데이터.
 * - user_stats 1행 (집계 캐시)
 * - daily_activity 14일치 (raw)
 * - user_words byStatus + addedThisWeek (직접 카운트)
 */
export async function fetchStats(): Promise<StatsSummary> {
  const todayKey = kstTodayKey();
  const fourteenDaysAgoKey = kstDateKey(new Date(Date.now() - 13 * DAY_MS));
  const sevenDaysAgoKey = kstDateKey(new Date(Date.now() - 6 * DAY_MS));

  const [statsRes, dailyRes, userWordsRes] = await Promise.all([
    supabase
      .from("user_stats")
      .select(
        "total_words, total_reviews, current_streak, longest_streak, last_active_date"
      )
      .maybeSingle(),
    supabase
      .from("daily_activity")
      .select("activity_date, review_count")
      .gte("activity_date", fourteenDaysAgoKey)
      .order("activity_date", { ascending: true }),
    supabase.from("user_words").select("status, created_at"),
  ]);

  if (statsRes.error) throw statsRes.error;
  if (dailyRes.error) throw dailyRes.error;
  if (userWordsRes.error) throw userWordsRes.error;

  const byStatus: StatusCounts = { new: 0, learning: 0, mastered: 0 };
  let addedThisWeek = 0;
  const userWords = userWordsRes.data ?? [];
  for (const r of userWords) {
    const status: WordStatus | undefined =
      r.status === "new" || r.status === "learning" || r.status === "mastered"
        ? r.status
        : undefined;
    if (status) byStatus[status]++;
    if (r.created_at && kstDateKey(r.created_at) >= sevenDaysAgoKey) {
      addedThisWeek++;
    }
  }

  const dailyMap = new Map<string, number>();
  for (const d of dailyRes.data ?? []) {
    if (d.activity_date) dailyMap.set(d.activity_date, d.review_count ?? 0);
  }
  const daily: DailyCount[] = [];
  for (let i = 13; i >= 0; i--) {
    const key = kstDateKey(new Date(Date.now() - i * DAY_MS));
    daily.push({ date: key, count: dailyMap.get(key) ?? 0 });
  }

  let thisWeekReviews = 0;
  for (let i = 6; i >= 0; i--) {
    const key = kstDateKey(new Date(Date.now() - i * DAY_MS));
    thisWeekReviews += dailyMap.get(key) ?? 0;
  }
  const todayReviews = dailyMap.get(todayKey) ?? 0;

  const stats = statsRes.data;
  const total = stats?.total_words ?? userWords.length;

  return {
    total,
    byStatus,
    addedThisWeek,
    thisWeekReviews,
    todayReviews,
    streak: stats?.current_streak ?? 0,
    longestStreak: stats?.longest_streak ?? 0,
    daily,
  };
}

/**
 * 홈 화면 7일 도트용 — 이번 주(KST 월~일) 활동이 있었던 날짜 집합.
 * @returns Set of YYYY-MM-DD
 */
export async function loadThisWeekActivity(): Promise<Set<string>> {
  const monday = thisWeekMondayKey();
  const sunday = kstDateKey(addDaysKst(monday, 6));
  const { data, error } = await supabase
    .from("daily_activity")
    .select("activity_date")
    .gte("activity_date", monday)
    .lte("activity_date", sunday);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) {
    if (r.activity_date) set.add(r.activity_date);
  }
  return set;
}

/** 이번 주 월요일의 KST 날짜 키 (월=시작) */
export function thisWeekMondayKey(): string {
  const kstNow = new Date(Date.now() + KST_OFFSET_MS);
  const dow = kstNow.getUTCDay(); // 0=일, 1=월, ..., 6=토
  const offsetToMonday = (dow + 6) % 7;
  const monday = new Date(kstNow.getTime() - offsetToMonday * DAY_MS);
  return monday.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" 키에 일수 더한 Date 객체 (UTC midnight 기준) */
function addDaysKst(key: string, days: number): Date {
  const d = new Date(`${key}T00:00:00Z`);
  return new Date(d.getTime() + days * DAY_MS);
}

/** 월~일 7일을 KST 키 배열로 (0=월, 6=일) */
export function thisWeekDayKeys(): string[] {
  const monday = thisWeekMondayKey();
  return Array.from({ length: 7 }, (_, i) => kstDateKey(addDaysKst(monday, i)));
}
