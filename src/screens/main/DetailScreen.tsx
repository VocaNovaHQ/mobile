import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Button,
  Chip,
  HighlightedSentence,
  Icon,
  Phonetic,
  Ring,
} from "../../components";
import { colors } from "../../theme/tokens";
import { loadWord } from "../../lib/dataSource";
import { formatDueLabel } from "../../lib/srs";
import { setWordFavorite } from "../../lib/words";
import type { Pronunciation, Word } from "../../types/word";
import type { RootStackScreenProps } from "../../navigation/types";

export function DetailScreen({
  route,
  navigation,
}: RootStackScreenProps<"Detail">) {
  const insets = useSafeAreaInsets();
  const [word, setWord] = useState<Word | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    let active = true;
    loadWord(route.params.wordId)
      .then((w) => {
        if (active) {
          setWord(w);
          setBookmarked(w?.user_word?.is_favorite ?? false);
          if (!w) setError("단어를 찾을 수 없습니다.");
        }
      })
      .catch((e) => {
        if (active) setError(e?.message ?? "단어를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [route.params.wordId]);

  if (error) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.ink[900],
            textAlign: "center",
          }}
        >
          {error}
        </Text>
        <View style={{ marginTop: 16 }}>
          <Button variant="secondary" onPress={() => navigation.goBack()}>
            뒤로가기
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!word) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.blue[500]} />
      </SafeAreaView>
    );
  }

  const us = pickPronunciation(word.snapshot.pronunciations, "미국");
  const uk = pickPronunciation(word.snapshot.pronunciations, "영국");
  const masteryPct = Math.round(word.mastery * 100);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Sticky top bar */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottomWidth: 0.5,
          borderBottomColor: "rgba(15,23,42,0.06)",
          backgroundColor: "rgba(255,255,255,0.92)",
        }}
      >
        <IconButton icon="chevron-left" onPress={() => navigation.goBack()} />
        <View style={{ flexDirection: "row", gap: 6 }}>
          <IconButton
            icon="bookmark"
            color={bookmarked ? colors.blue[500] : colors.ink[700]}
            onPress={() => {
              const next = !bookmarked;
              setBookmarked(next); // 낙관적 업데이트
              const userWordId = word?.user_word?.id;
              if (userWordId) {
                setWordFavorite(userWordId, next).catch(() => {
                  // 실패 시 롤백
                  setBookmarked(!next);
                });
              }
            }}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {word.user_word?.context_sentence ? (
          <View style={{ paddingHorizontal: 22, paddingTop: 16 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.ink[500],
                letterSpacing: 0.6,
                marginBottom: 8,
              }}
            >
              📝 이 문장에서 만났어요
            </Text>
            <View
              style={{
                borderLeftWidth: 3,
                borderLeftColor: colors.blue[500],
                backgroundColor: colors.blue[50],
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderTopRightRadius: 10,
                borderBottomRightRadius: 10,
              }}
            >
              <HighlightedSentence
                text={word.user_word.context_sentence}
                highlight={word.snapshot.word}
                baseStyle={{
                  fontSize: 14,
                  fontStyle: "italic",
                  color: colors.ink[800],
                  lineHeight: 22,
                }}
              />
            </View>
          </View>
        ) : null}

        {/* Word header */}
        <View
          style={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 12 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                fontSize: 38,
                fontWeight: "800",
                letterSpacing: -1.2,
                color: colors.ink[900],
              }}
            >
              {word.snapshot.word}
            </Text>
            {word.snapshot.source ? (
              <Chip color={colors.blue[600]} bg={colors.chip}>
                {word.snapshot.source.toUpperCase()}
              </Chip>
            ) : null}
          </View>

          {/* Phonetics */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 18,
              marginTop: 8,
            }}
          >
            {us ? (
              <Phonetic
                label="미국식"
                ipa={us.ipa || "—"}
                word={word.snapshot.word}
                dialect="us"
              />
            ) : null}
            {uk ? (
              <Phonetic
                label="영국식"
                ipa={uk.ipa || "—"}
                word={word.snapshot.word}
                dialect="uk"
              />
            ) : null}
          </View>

          {/* Mastery + streak strip */}
          <View
            style={{
              marginTop: 16,
              padding: 12,
              paddingHorizontal: 14,
              backgroundColor: colors.blue[50],
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Ring
              value={word.mastery}
              size={42}
              stroke={4}
              color={colors.blue[500]}
              track="#fff"
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: colors.blue[600],
                }}
              >
                {masteryPct}
              </Text>
            </Ring>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colors.ink[900],
                  marginBottom: 2,
                }}
              >
                학습 진행률
              </Text>
              <Text style={{ fontSize: 11, color: colors.ink[500] }}>
                {word.user_word?.review_count ?? 0}회 학습 · 다음 복습{" "}
                <Text style={{ color: colors.blue[500], fontWeight: "700" }}>
                  {formatDueLabel(word.user_word?.srs_due_at)}
                </Text>
              </Text>
            </View>
            <Icon
              name="flame"
              size={18}
              color={colors.warn}
              strokeWidth={2.2}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: colors.ink[900],
              }}
            >
              {word.user_word?.correct_count ?? 0}
            </Text>
          </View>
        </View>

        {/* Senses */}
        <View
          style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 24 }}
        >
          {word.snapshot.partsOfSpeech.map((s, si) => (
            <View key={si} style={{ marginTop: si === 0 ? 8 : 18 }}>
              <Chip
                color={colors.blue[600]}
                bg={colors.chip}
                style={{ marginBottom: 14 }}
              >
                {s.pos}
              </Chip>
              {s.meanings.map((d, di) => (
                <View
                  key={di}
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginBottom: 18,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: colors.blue[500],
                      lineHeight: 24,
                      width: 18,
                    }}
                  >
                    {di + 1}.
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.ink[900],
                        lineHeight: 24,
                        marginBottom: d.exampleEn ? 10 : 0,
                      }}
                    >
                      {d.definition}
                    </Text>
                    {d.exampleEn ? (
                      <View
                        style={{
                          borderLeftWidth: 3,
                          borderLeftColor: colors.ink[200],
                          backgroundColor: colors.ink[50],
                          padding: 10,
                          paddingHorizontal: 12,
                          borderTopRightRadius: 10,
                          borderBottomRightRadius: 10,
                        }}
                      >
                        <HighlightedSentence
                          text={d.exampleEn}
                          highlight={word.snapshot.word}
                          baseStyle={{
                            fontSize: 14,
                            fontStyle: "italic",
                            color: colors.ink[800],
                            lineHeight: 22,
                            marginBottom: d.exampleKo ? 6 : 0,
                          }}
                        />
                        {d.exampleKo ? (
                          <Text
                            style={{
                              fontSize: 13,
                              color: colors.ink[500],
                              lineHeight: 20,
                            }}
                          >
                            {d.exampleKo}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function pickPronunciation(
  list: Pronunciation[],
  key: "미국" | "영국",
): Pronunciation | undefined {
  return (
    list.find((p) => p.label.includes(key)) ??
    (key === "미국"
      ? list.find((p) => p.label.includes("미국∙영국"))
      : undefined)
  );
}

function IconButton({
  icon,
  onPress,
  color = colors.ink[700],
}: {
  icon: any;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: colors.ink[100],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon} size={18} color={color} strokeWidth={2} />
    </Pressable>
  );
}
