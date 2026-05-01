import { Pressable, Text, View } from "react-native";
import { Icon } from "./Icon";
import { colors } from "../theme/tokens";
import { playWord, type Dialect } from "../lib/pronunciation";
import { normalizeIpa } from "../lib/text";

export type PhoneticProps = {
  label: string;
  ipa: string;
  /** 발음 재생 대상 단어 (lemma). onPlay 미지정 시 자동으로 이 단어를 재생 */
  word?: string;
  /** 미국식("us") / 영국식("uk") 발음 중 무엇을 재생할지 */
  dialect?: Dialect;
  dark?: boolean;
  onPlay?: () => void;
};

export function Phonetic({
  label,
  ipa,
  word,
  dialect = "us",
  dark,
  onPlay,
}: PhoneticProps) {
  const handlePress =
    onPlay ?? (word ? () => playWord(word, dialect) : undefined);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: dark ? colors.ink[400] : colors.ink[500],
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 15,
          fontStyle: "italic",
          color: dark ? colors.ink[200] : colors.ink[800],
        }}
      >
        [{normalizeIpa(ipa)}]
      </Text>
      <Pressable
        onPress={handlePress}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: dark ? "rgba(255,255,255,0.06)" : colors.ink[100],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          name="speaker"
          size={14}
          color={dark ? colors.ink[300] : colors.ink[600]}
          strokeWidth={1.8}
        />
      </Pressable>
    </View>
  );
}
