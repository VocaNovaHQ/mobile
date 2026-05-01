import * as Speech from "expo-speech";

// expo-audio는 native module이라 Expo Go 등 미설치 환경에선 require가 throw할 수 있음.
// lazy + try-catch 로 안전 처리.
function loadAudioPlayer() {
  try {
    return require("expo-audio").createAudioPlayer as
      | ((source: { uri: string }) => any)
      | undefined;
  } catch {
    return undefined;
  }
}

const NAVER_ENDPOINT =
  "https://en.dict.naver.com/api3/enko/search?m=mobile&lang=ko&query=";

export type Dialect = "us" | "uk";

/**
 * 1차) 네이버 사전 API 직접 호출 → fresh mp3 URL 추출 → 재생
 * 2차) 실패 시 디바이스 TTS(expo-speech)로 단어 발음
 *
 * @param dialect "us" = 미국식, "uk" = 영국식. 기본 "us".
 */
export async function playWord(
  lemma: string,
  dialect: Dialect = "us"
): Promise<void> {
  const word = lemma.trim();
  if (!word) return;
  console.log("[playWord] start:", word, "dialect:", dialect);

  // 1. 네이버 fetch + expo-audio 재생 시도
  const createAudioPlayer = loadAudioPlayer();
  if (createAudioPlayer) {
    try {
      const url = await fetchFreshAudioUrl(word, dialect);
      console.log("[playWord]", dialect, "URL:", url ? "OK" : "null");
      if (url) {
        const player = createAudioPlayer({ uri: url });
        player.play();
        const sub = player.addListener(
          "playbackStatusUpdate",
          (status: any) => {
            if (status?.didJustFinish) {
              console.log("[playWord] mp3 finished");
              sub.remove();
              player.remove();
            }
          }
        );
        return;
      }
    } catch (e) {
      console.warn("[playWord] mp3 path failed:", (e as Error)?.message ?? e);
    }
  } else {
    console.log("[playWord] expo-audio unavailable (Expo Go?), skipping mp3");
  }

  // 2. TTS 폴백 — dialect별 시스템 음성 선택
  console.log("[playWord] falling back to TTS");
  speakLocal(word, dialect);
}

/**
 * 디바이스 TTS만 호출 (네이버 우회 — 항상 동작).
 */
export function speakLocal(word: string, dialect: Dialect = "us") {
  Speech.stop();
  Speech.speak(word, {
    language: dialect === "uk" ? "en-GB" : "en-US",
    pitch: 1.0,
    rate: 0.95,
  });
}

async function fetchFreshAudioUrl(
  word: string,
  dialect: Dialect
): Promise<string | null> {
  const url = NAVER_ENDPOINT + encodeURIComponent(word);
  console.log("[fetch] →", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Referer: "https://en.dict.naver.com",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    },
  });
  console.log("[fetch] status:", res.status);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn("[fetch] body (first 200):", body.slice(0, 200));
    return null;
  }

  const json = await res.json();
  const items = json?.searchResultMap?.searchResultListMap?.WORD?.items;
  if (!Array.isArray(items) || items.length === 0) {
    console.warn("[fetch] no items in response");
    return null;
  }

  const symbols = items[0].searchPhoneticSymbolList;
  if (!Array.isArray(symbols)) {
    console.warn("[fetch] no symbol list");
    return null;
  }
  const withMp3 = symbols.filter((s: any) => s.symbolFile);
  console.log(
    "[fetch] symbols:",
    symbols.length,
    "with mp3:",
    withMp3.length,
    withMp3.map((s: any) => s.symbolType).join(", ")
  );

  return pickByDialect(withMp3, dialect);
}

/**
 * 응답에서 dialect에 맞는 mp3 URL 선택.
 * - "us" 요청: US 단독(미국식) > US∙GB 통합(미국∙영국) > null
 * - "uk" 요청: GB 단독(영국식) > US∙GB 통합(미국∙영국) > null
 */
function pickByDialect(withMp3: any[], dialect: Dialect): string | null {
  if (withMp3.length === 0) return null;

  const code = (s: any) => (s.symbolTypeCode as string | undefined) ?? "";
  const isCombined = (s: any) =>
    code(s).includes("US") && code(s).includes("GB");

  if (dialect === "us") {
    const usOnly = withMp3.find(
      (s: any) => code(s) === "US" || (code(s).includes("US") && !code(s).includes("GB"))
    );
    const combined = withMp3.find(isCombined);
    return usOnly?.symbolFile ?? combined?.symbolFile ?? null;
  }

  // uk
  const ukOnly = withMp3.find(
    (s: any) => code(s) === "GB" || (code(s).includes("GB") && !code(s).includes("US"))
  );
  const combined = withMp3.find(isCombined);
  return ukOnly?.symbolFile ?? combined?.symbolFile ?? null;
}
