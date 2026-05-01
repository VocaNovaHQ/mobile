// 인증된 사용자만 진입 가능한 흐름이므로 항상 Supabase 호출.
// 에러는 throw 하여 화면에서 로딩/에러/빈 상태로 처리.

import { fetchMyWords, fetchWordById, fetchDueWords } from "./words";
import type { Word } from "../types/word";

export async function loadWords(): Promise<Word[]> {
  return fetchMyWords({ limit: 200 });
}

export async function loadWord(id: string): Promise<Word | null> {
  return fetchWordById(id);
}

export async function loadDueWords(): Promise<Word[]> {
  return fetchDueWords(30);
}
