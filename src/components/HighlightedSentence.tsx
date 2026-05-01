import { Text, type TextProps } from "react-native";
import { colors } from "../theme/tokens";

export type HighlightedSentenceProps = Omit<TextProps, "children"> & {
  /** 원문 (HTML strong 태그가 들어있을 수 있음) */
  text: string;
  /** 강조할 단어 (대소문자 무시) */
  highlight: string;
  baseStyle?: TextProps["style"];
  highlightColor?: string;
};

/**
 * 영어 예문 안에서 검색어를 blue 500 + 굵게 강조.
 * 네이버 사전이 박은 <strong>...</strong> 도 처리.
 */
export function HighlightedSentence({
  text,
  highlight,
  baseStyle,
  highlightColor = colors.blue[500],
  ...rest
}: HighlightedSentenceProps) {
  // 1) <strong> 태그 정규화 — 그 안의 텍스트도 highlight 대상
  const cleaned = text.replace(/<\/?strong>/g, "");
  const tokens = splitWithMarker(cleaned, highlight);

  return (
    <Text style={baseStyle} {...rest}>
      {tokens.map((t, i) =>
        t.isWord ? (
          <Text
            key={i}
            style={{
              color: highlightColor,
              fontWeight: "700",
              fontStyle: "normal",
            }}
          >
            {t.text}
          </Text>
        ) : (
          <Text key={i}>{t.text}</Text>
        )
      )}
    </Text>
  );
}

function splitWithMarker(text: string, word: string) {
  const out: { text: string; isWord: boolean }[] = [];
  if (!word) {
    return [{ text, isWord: false }];
  }
  const lower = text.toLowerCase();
  const target = word.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(target, i);
    if (idx === -1) {
      out.push({ text: stripMarker(text.slice(i)), isWord: false });
      break;
    }
    if (idx > i) {
      out.push({ text: stripMarker(text.slice(i, idx)), isWord: false });
    }
    out.push({
      text: stripMarker(text.slice(idx, idx + target.length)),
      isWord: true,
    });
    i = idx + target.length;
  }
  return out;
}

function stripMarker(s: string) {
  return s.replace(//g, "");
}
