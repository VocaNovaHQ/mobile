// 네이버 영어사전 API 클라이언트 + 응답 파서.
// 원본: voca-extension/parser.js + background.js handleLookup
// DOM 의존 (document.createElement)을 정규식 기반으로 대체.

import type { PartOfSpeech, Pronunciation, RelatedWord, WordSnapshot } from "../types/word";

const NAVER_ENDPOINT =
  "https://en.dict.naver.com/api3/enko/search?m=mobile&lang=ko&query=";

const HEADERS = {
  Referer: "https://en.dict.naver.com",
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
};

/**
 * 네이버 사전에서 단어 1개를 조회하고 WordSnapshot으로 파싱.
 * 검색 결과가 없으면 null. 네트워크/HTTP 오류는 throw.
 */
export async function lookupWord(word: string): Promise<WordSnapshot | null> {
  const trimmed = word.trim();
  if (!trimmed) return null;

  const res = await fetch(NAVER_ENDPOINT + encodeURIComponent(trimmed), {
    method: "GET",
    headers: HEADERS,
  });
  if (!res.ok) {
    throw new Error(`네이버 사전 응답 오류 (${res.status})`);
  }
  const json = await res.json();
  return parseEntry(json);
}

// ─── 파서 (parser.js 포팅) ─────────────────────────────

/**
 * HTML 태그를 제거하고 엔티티를 디코딩한 plain text 반환.
 * 원본 stripHtml() 의 DOM template 방식을 정규식으로 대체.
 */
function stripHtml(input: string | null | undefined): string {
  if (input == null) return "";
  return String(input)
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * 예문에서 <strong> 강조만 의미 있고 나머지 마크업은 노이즈.
 * RN 측 HighlightedSentence가 단어 일치로 동적 하이라이트를 하므로
 * <strong> 정보는 손실 무방. 따라서 stripHtml과 동일하게 처리.
 */
function sanitizeExample(input: string | null | undefined): string {
  return stripHtml(input);
}

/**
 * 네이버 IPA의 강세 기호 정규화.
 * <sup>│</sup> → ˈ (primary), <sub>│</sub> → ˌ (secondary).
 * 잔존 │ 는 ˈ 로 변환, 기타 HTML 태그 제거.
 */
function normalizeIpa(input: string | null | undefined): string {
  if (!input) return "";
  return String(input)
    .replace(/<sup>│<\/sup>/g, "ˈ")
    .replace(/<sub>│<\/sub>/g, "ˌ")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/│/g, "ˈ")
    .trim();
}

/** "word^url|word^url" 형태의 유의어/반의어 문자열 파싱. */
function parsePipeList(raw: string | null | undefined): RelatedWord[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split("|")
    .map((chunk) => {
      const [word, url] = chunk.split("^");
      if (!word) return null;
      return { word: word.trim(), url: (url ?? "").trim() } satisfies RelatedWord;
    })
    .filter((x): x is RelatedWord => x !== null);
}

function parsePronunciations(list: any): Pronunciation[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((p) => ({
      label: stripHtml(p?.symbolType) || "",
      ipa: normalizeIpa(p?.symbolValue),
      audioUrl: typeof p?.symbolFile === "string" ? p.symbolFile : "",
    }))
    .filter((p) => p.ipa || p.audioUrl);
}

function parsePartsOfSpeech(collectors: any): PartOfSpeech[] {
  if (!Array.isArray(collectors)) return [];
  return collectors
    .map((c) => {
      const meanings = (Array.isArray(c?.means) ? c.means : [])
        .map((m: any) => ({
          order: stripHtml(m?.order) || "",
          definition: stripHtml(m?.value),
          exampleEn: sanitizeExample(m?.exampleOri),
          exampleKo: stripHtml(m?.exampleTrans),
        }))
        .filter((m: any) => m.definition);
      return {
        pos: stripHtml(c?.partOfSpeech) || "",
        meanings,
      };
    })
    .filter((p) => p.meanings.length > 0);
}

/**
 * 네이버 응답 JSON → WordSnapshot.
 * 결과 없거나 표제어/품사 추출 실패 시 null.
 */
export function parseEntry(json: any): WordSnapshot | null {
  const item = json?.searchResultMap?.searchResultListMap?.WORD?.items?.[0];
  if (!item) return null;

  const word = stripHtml(item.handleEntry);
  if (!word) return null;

  const partsOfSpeech = parsePartsOfSpeech(item.meansCollector);
  if (partsOfSpeech.length === 0) return null;

  const images =
    item.hasImage && Array.isArray(item.entryImageURL)
      ? item.entryImageURL.filter(Boolean).slice(0, 1)
      : [];

  return {
    word,
    externalUrl: `https://en.dict.naver.com/#/search?query=${encodeURIComponent(word)}`,
    source: stripHtml(item.sourceDictnameKO) || "",
    level: stripHtml(item.frequencyAdd) || "",
    hasIdiom: !!item.hasIdiom,
    pronunciations: parsePronunciations(item.searchPhoneticSymbolList),
    partsOfSpeech,
    synonyms: parsePipeList(item.expSynonym),
    antonyms: parsePipeList(item.expAntonym),
    images,
  };
}
