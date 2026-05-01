// SuperMemo SM-2 lite — 단어 학습 간격 계산
// 입력: 현재 SRS 상태 + 사용자 응답
// 출력: 다음 상태(interval, ease, due_at, status, mastery)

import type { ReviewResult, WordStatus } from "../types/word";

export type SrsState = {
  interval_days: number;
  ease: number; // SuperMemo의 EF (1.3 ~ 2.5+)
  review_count: number;
  correct_count: number;
};

export type SrsTransition = {
  next: SrsState;
  due_at: Date;
  status: WordStatus;
  /** 0..1 화면 표시용 */
  mastery: number;
};

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

const QUALITY: Record<ReviewResult, number> = {
  again: 0,
  hard: 2,
  good: 4,
  easy: 5,
};

export function applyReview(state: SrsState, result: ReviewResult): SrsTransition {
  const q = QUALITY[result];
  const isCorrect = q >= 3;

  const review_count = state.review_count + 1;
  const correct_count = state.correct_count + (isCorrect ? 1 : 0);

  let ease = state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ease = Math.max(MIN_EASE, Math.min(MAX_EASE, ease));

  let interval_days: number;
  if (!isCorrect) {
    interval_days = 1;
  } else if (state.review_count === 0) {
    interval_days = 1;
  } else if (state.review_count === 1) {
    interval_days = 6;
  } else {
    interval_days = Math.round(state.interval_days * ease);
  }

  const due_at = new Date();
  due_at.setDate(due_at.getDate() + interval_days);

  // 단순 status / mastery 추정
  const status: WordStatus =
    interval_days >= 21 ? "mastered" : review_count === 0 ? "new" : "learning";
  const mastery = computeMastery({ interval_days, ease, review_count, correct_count });

  return {
    next: { interval_days, ease, review_count, correct_count },
    due_at,
    status,
    mastery,
  };
}

export function computeMastery(s: SrsState): number {
  // 0..1: 정답률 50% × 간격 점수 50%
  const accuracy = s.review_count === 0 ? 0 : s.correct_count / s.review_count;
  // 21일 = 1.0 만점
  const intervalScore = Math.min(1, s.interval_days / 21);
  return Math.max(0, Math.min(1, accuracy * 0.5 + intervalScore * 0.5));
}

export function isDue(srs_due_at: string | null | undefined): boolean {
  if (!srs_due_at) return true;
  return new Date(srs_due_at).getTime() <= Date.now();
}

export function formatDueLabel(srs_due_at: string | null | undefined): string {
  if (!srs_due_at) return "지금 복습";
  const due = new Date(srs_due_at);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) return "지금 복습";
  if (diffDays === 0) {
    const hours = Math.round(diffMs / (1000 * 60 * 60));
    return hours <= 1 ? "곧 복습" : `${hours}시간 후`;
  }
  if (diffDays === 1) return "내일";
  if (diffDays < 7) return `${diffDays}일 후`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)}주 후`;
  return `${Math.round(diffDays / 30)}개월 후`;
}
