// 인증된 사용자만 진입 가능한 흐름이므로 항상 Supabase 호출.
// 에러는 throw 하여 화면에서 로딩/에러/빈 상태로 처리.

import { fetchMyWords, fetchWordById, fetchDueWords } from "./words";
import type { Word, WordStatus } from "../types/word";

export const WORDS_PAGE_SIZE = 30;

export type WordFilter = "all" | WordStatus | "favorite";

export async function loadWords(): Promise<Word[]> {
  return fetchMyWords({ limit: 200 });
}

export async function loadWordsPage(opts: {
  filter: WordFilter;
  search: string;
  page: number;
  pageSize?: number;
}): Promise<Word[]> {
  const pageSize = opts.pageSize ?? WORDS_PAGE_SIZE;
  const args: Parameters<typeof fetchMyWords>[0] = {
    limit: pageSize,
    offset: opts.page * pageSize,
  };
  if (opts.filter === "favorite") {
    args.isFavorite = true;
  } else if (opts.filter !== "all") {
    args.status = opts.filter;
  }
  if (opts.search) {
    args.search = opts.search;
  }
  return fetchMyWords(args);
}

export async function loadWord(id: string): Promise<Word | null> {
  return fetchWordById(id);
}

export async function loadDueWords(): Promise<Word[]> {
  return fetchDueWords(30);
}
