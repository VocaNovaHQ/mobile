import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Chip, HighlightedSentence, Icon } from "../../components";
import { colors } from "../../theme/tokens";
import { loadDueWords, loadWord } from "../../lib/dataSource";
import { playWord } from "../../lib/pronunciation";
import {
  buildPendingReview,
  commitReviewSession,
  type PendingReview,
  type SessionCommitResult,
} from "../../lib/words";
import type { Word } from "../../types/word";
import type { RootStackScreenProps } from "../../navigation/types";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_HEIGHT = 420;
const SWIPE_THRESHOLD = 80;
const FLY_OUT = SCREEN_W + 100;

export function StudyScreen({ route, navigation }: RootStackScreenProps<"Study">) {
  const insets = useSafeAreaInsets();
  const [deck, setDeck] = useState<Word[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState({ know: 0, dont: 0, streak: 0 });
  // 메모리 큐 — swipe할 때마다 push, 세션 끝에 한 번에 commit
  const queueRef = useRef<PendingReview[]>([]);
  const [commitResult, setCommitResult] = useState<SessionCommitResult | null>(null);
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (route.params?.wordIds && route.params.wordIds.length > 0) {
        const words = await Promise.all(
          route.params.wordIds.map((id) => loadWord(id))
        );
        if (active) setDeck(words.filter((w): w is Word => !!w));
      } else {
        const due = await loadDueWords();
        if (active) setDeck(due);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [route.params]);

  // unmount 시 잔여 큐 백그라운드 commit (X 닫기 등으로 끝났을 때)
  useEffect(() => {
    return () => {
      const pending = queueRef.current;
      if (pending.length > 0) {
        commitReviewSession(pending).catch(() => {});
        queueRef.current = [];
      }
    };
  }, []);

  // 모든 카드 끝 → FinishedState 진입 직전에 한 번만 commit
  useEffect(() => {
    if (deck && idx >= deck.length && !committed) {
      const pending = queueRef.current;
      setCommitted(true);
      if (pending.length === 0) return;
      commitReviewSession(pending)
        .then((res) => {
          if (res) setCommitResult(res);
          queueRef.current = [];
        })
        .catch(() => {});
    }
  }, [deck, idx, committed]);

  if (!deck) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.ink[50],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.blue[500]} />
      </View>
    );
  }

  if (deck.length === 0) {
    return <EmptyState onClose={() => navigation.goBack()} />;
  }

  if (idx >= deck.length) {
    return (
      <FinishedState
        score={score}
        total={deck.length}
        commitResult={commitResult}
        onClose={() => navigation.goBack()}
      />
    );
  }

  const handleSwipe = (direction: "left" | "right") => {
    const isCorrect = direction === "right";
    setScore((s) => ({
      know: s.know + (isCorrect ? 1 : 0),
      dont: s.dont + (isCorrect ? 0 : 1),
      streak: isCorrect ? s.streak + 1 : 0,
    }));

    const card = deck[idx];
    if (card.user_word) {
      queueRef.current.push(
        buildPendingReview(card.user_word, isCorrect ? "good" : "again")
      );
    }
    setIdx((i) => i + 1);
  };

  const card = deck[idx];
  const next = deck[idx + 1];
  const progress = (idx + 1) / deck.length;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.ink[50],
        paddingTop: insets.top + 8,
      }}
    >
      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <IconBtn icon="x" onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }}>
          <View
            style={{
              height: 6,
              backgroundColor: colors.ink[200],
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                backgroundColor: colors.blue[500],
                borderRadius: 3,
              }}
            />
          </View>
        </View>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: colors.ink[800],
          }}
        >
          {idx + 1}
          <Text style={{ color: colors.ink[500], fontWeight: "500" }}>
            /{deck.length}
          </Text>
        </Text>
      </View>

      {/* Score chips */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <ScoreChip icon="check" label="안다" count={score.know} color={colors.success} />
        <ScoreChip icon="x" label="모른다" count={score.dont} color={colors.danger} />
        <ScoreChip icon="flame" label="연속" count={score.streak} color={colors.warn} />
      </View>

      {/* Card stack */}
      <View
        style={{
          height: CARD_HEIGHT + 40,
          paddingHorizontal: 24,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {next ? (
          <View
            style={{
              position: "absolute",
              top: 28,
              left: 28,
              right: 28,
              transform: [{ scale: 0.94 }],
              opacity: 0.6,
            }}
          >
            <FlashCard word={next} />
          </View>
        ) : null}

        <SwipeableCard
          key={card.id}
          word={card}
          onSwipe={handleSwipe}
        />
      </View>

      {/* Hint */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
          marginTop: 8,
        }}
      >
        <Icon name="flip" size={14} color={colors.ink[500]} />
        <Text style={{ fontSize: 12, color: colors.ink[500] }}>
          탭해서 뒤집기 · 좌우로 스와이프
        </Text>
      </View>

      {/* Action buttons (manual swipe) */}
      <View
        style={{
          marginTop: 18,
          flexDirection: "row",
          gap: 16,
          justifyContent: "center",
          paddingBottom: insets.bottom + 16,
        }}
      >
        <ActionBtn
          icon="x"
          color={colors.danger}
          onPress={() => handleSwipe("left")}
        />
        <ActionBtn icon="flip" color={colors.blue[500]} small />
        <ActionBtn
          icon="check"
          color={colors.success}
          onPress={() => handleSwipe("right")}
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Swipeable card (Pan + Tap gesture composition)
// ─────────────────────────────────────────────────────
function SwipeableCard({
  word,
  onSwipe,
}: {
  word: Word;
  onSwipe: (dir: "left" | "right") => void;
}) {
  const x = useSharedValue(0);
  const flipped = useSharedValue(0); // 0 = front, 1 = back
  // 발음 버튼이 가장 최근에 눌린 시각 (ms). Tap gesture가 release 시점에
  // 함께 fire되는 걸 방지하기 위해 worklet에서 비교용으로 사용.
  const audioPressedAt = useSharedValue(0);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const flyOut = (dir: "left" | "right") => {
    triggerHaptic();
    onSwipe(dir);
  };

  const markAudioPressed = () => {
    audioPressedAt.value = Date.now();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      x.value = e.translationX;
    })
    .onEnd((e) => {
      const dx = e.translationX;
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        const dir = dx > 0 ? "right" : "left";
        x.value = withTiming(dir === "right" ? FLY_OUT : -FLY_OUT, {
          duration: 220,
        });
        runOnJS(flyOut)(dir);
      } else {
        x.value = withTiming(0, { duration: 220 });
      }
    });

  const tap = Gesture.Tap()
    .maxDistance(8)
    .onStart(() => {
      "worklet";
      // 발음 버튼 누른 직후 300ms 안에 발생한 tap은 flip 무시
      if (Date.now() - audioPressedAt.value < 300) return;
      flipped.value = withTiming(flipped.value === 0 ? 1 : 0, {
        duration: 550,
      });
    });

  const gesture = Gesture.Race(pan, tap);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { rotateZ: `${x.value * 0.06}deg` },
    ],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flipped.value, [0, 1], [0, 180])}deg` },
    ],
    opacity: interpolate(flipped.value, [0, 0.5, 1], [1, 0, 0]),
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flipped.value, [0, 1], [180, 360])}deg` },
    ],
    opacity: interpolate(flipped.value, [0, 0.5, 1], [0, 0, 1]),
  }));

  const knowOpacity = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, x.value / SWIPE_THRESHOLD)),
  }));
  const dontOpacity = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, -x.value / SWIPE_THRESHOLD)),
  }));

  // 카드 변경 시 flipped 리셋
  useEffect(() => {
    cancelAnimation(flipped);
    flipped.value = 0;
    x.value = 0;
  }, [word.id]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 8,
            left: 24,
            right: 24,
            height: CARD_HEIGHT,
          },
          containerStyle,
        ]}
      >
        <Animated.View style={[StyleAbsFill, frontStyle]}>
          <FlashCardFront word={word} onAudioPressIn={markAudioPressed} />
        </Animated.View>
        <Animated.View style={[StyleAbsFill, backStyle]}>
          <FlashCardBack word={word} />
        </Animated.View>

        {/* Swipe affordance overlays */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 30,
              left: 32,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: 2.5,
              borderColor: colors.danger,
              backgroundColor: "rgba(255,255,255,0.6)",
              transform: [{ rotateZ: "-12deg" }],
            },
            dontOpacity,
          ]}
          pointerEvents="none"
        >
          <Text
            style={{
              color: colors.danger,
              fontSize: 14,
              fontWeight: "800",
              letterSpacing: 0.5,
            }}
          >
            모른다
          </Text>
        </Animated.View>
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 30,
              right: 32,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: 2.5,
              borderColor: colors.success,
              backgroundColor: "rgba(255,255,255,0.6)",
              transform: [{ rotateZ: "12deg" }],
            },
            knowOpacity,
          ]}
          pointerEvents="none"
        >
          <Text
            style={{
              color: colors.success,
              fontSize: 14,
              fontWeight: "800",
              letterSpacing: 0.5,
            }}
          >
            안다!
          </Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const StyleAbsFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backfaceVisibility: "hidden" as const,
};

// ─────────────────────────────────────────────────────
// Card faces
// ─────────────────────────────────────────────────────
function FlashCardFront({
  word,
  onAudioPressIn,
}: {
  word: Word;
  onAudioPressIn?: () => void;
}) {
  const pos = word.snapshot.partsOfSpeech[0]?.pos ?? "단어";
  const ipa = word.snapshot.pronunciations[0]?.ipa ?? "";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 26,
        justifyContent: "space-between",
        borderWidth: 0.5,
        borderColor: "rgba(15,23,42,0.06)",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 6,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Chip color={colors.blue[600]} bg={colors.chip} size="sm">
          {pos}
        </Chip>
        <Pressable
          onPressIn={onAudioPressIn}
          onPress={() => playWord(word.snapshot.word)}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.ink[100],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="speaker" size={18} color={colors.ink[700]} />
        </Pressable>
      </View>

      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontSize: 44,
            fontWeight: "800",
            letterSpacing: -1.5,
            color: colors.ink[900],
            marginBottom: 12,
          }}
        >
          {word.snapshot.word}
        </Text>
        {ipa ? (
          <Text
            style={{
              fontSize: 16,
              fontStyle: "italic",
              color: colors.ink[500],
            }}
          >
            [{ipa}]
          </Text>
        ) : null}
      </View>

      <Text
        style={{
          textAlign: "center",
          fontSize: 13,
          color: colors.ink[500],
          fontWeight: "600",
        }}
      >
        탭해서 뜻 보기 ↓
      </Text>
    </View>
  );
}

function FlashCardBack({ word }: { word: Word }) {
  const pos = word.snapshot.partsOfSpeech[0]?.pos ?? "단어";
  const firstMeaning = word.snapshot.partsOfSpeech[0]?.meanings[0];
  const ko = firstMeaning?.definition ?? "";
  const en = firstMeaning?.exampleEn ?? "";
  const tr = firstMeaning?.exampleKo ?? "";
  const context = (word.user_word?.context_sentence ?? "").trim();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.blue[500],
        borderRadius: 24,
        padding: 26,
        justifyContent: "space-between",
        shadowColor: colors.blue[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 6,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Chip color="#fff" bg="rgba(255,255,255,0.18)" size="sm">
          {pos}
        </Chip>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff", opacity: 0.7 }}>
          {word.snapshot.word}
        </Text>
      </View>
      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            letterSpacing: -0.6,
            color: "#fff",
            textAlign: "center",
            lineHeight: 36,
            marginBottom: 16,
          }}
        >
          {ko || "—"}
        </Text>
        {en ? (
          <View
            style={{
              padding: 14,
              backgroundColor: "rgba(255,255,255,0.12)",
              borderRadius: 14,
              alignSelf: "stretch",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontStyle: "italic",
                color: "#fff",
                lineHeight: 22,
                marginBottom: 6,
              }}
            >
              "{en.replace(/<\/?strong>/g, "")}"
            </Text>
            {tr ? (
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                {tr}
              </Text>
            ) : null}
          </View>
        ) : null}
        {context ? (
          <View
            style={{
              marginTop: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 12,
              alignSelf: "stretch",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: 0.4,
                marginBottom: 4,
              }}
            >
              📝 이 문장에서 만났어요
            </Text>
            <HighlightedSentence
              text={context}
              highlight={word.snapshot.word}
              numberOfLines={3}
              baseStyle={{
                fontSize: 13,
                fontStyle: "italic",
                color: "rgba(255,255,255,0.9)",
                lineHeight: 19,
              }}
              highlightColor="#FFD166"
            />
          </View>
        ) : null}
      </View>
      <Text
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "#fff",
          opacity: 0.7,
          fontWeight: "600",
        }}
      >
        다시 탭해서 앞면 ↑
      </Text>
    </View>
  );
}

// 미리보기용 (next 카드 — 인터랙션 없음)
function FlashCard({ word }: { word: Word }) {
  return (
    <View style={{ height: CARD_HEIGHT }}>
      <FlashCardFront word={word} />
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────
function ScoreChip({
  icon,
  label,
  count,
  color,
}: {
  icon: any;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#fff",
        borderWidth: 0.5,
        borderColor: "rgba(15,23,42,0.06)",
      }}
    >
      <Icon name={icon} size={14} color={color} strokeWidth={2.4} />
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.ink[700] }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: "800", color }}>{count}</Text>
    </View>
  );
}

function ActionBtn({
  icon,
  color,
  onPress,
  small,
}: {
  icon: any;
  color: string;
  onPress?: () => void;
  small?: boolean;
}) {
  const size = small ? 52 : 64;
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      <Icon name={icon} size={small ? 22 : 28} color={color} strokeWidth={2.5} />
    </Pressable>
  );
}

function IconBtn({
  icon,
  onPress,
}: {
  icon: any;
  onPress?: () => void;
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
      <Icon name={icon} size={20} color={colors.ink[700]} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────
// Empty / Finished states
// ─────────────────────────────────────────────────────
function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.ink[50],
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <Icon name="sparkles" size={56} color={colors.blue[500]} />
      <Text
        style={{
          marginTop: 16,
          fontSize: 22,
          fontWeight: "800",
          color: colors.ink[900],
          letterSpacing: -0.4,
        }}
      >
        오늘 복습할 단어가 없어요
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 14,
          color: colors.ink[500],
          textAlign: "center",
        }}
      >
        브라우저에서 단어를 더 추가해보세요.
      </Text>
      <Pressable
        onPress={onClose}
        style={{
          marginTop: 24,
          paddingHorizontal: 22,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: colors.blue[500],
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
          닫기
        </Text>
      </Pressable>
    </View>
  );
}

function FinishedState({
  score,
  total,
  commitResult,
  onClose,
}: {
  score: { know: number; dont: number; streak: number };
  total: number;
  commitResult: SessionCommitResult | null;
  onClose: () => void;
}) {
  const accuracy = total > 0 ? Math.round((score.know / total) * 100) : 0;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.ink[50],
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <Icon name="trophy" size={56} color={colors.warn} />
      <Text
        style={{
          marginTop: 16,
          fontSize: 24,
          fontWeight: "800",
          color: colors.ink[900],
          letterSpacing: -0.4,
        }}
      >
        학습 완료!
      </Text>
      <Text
        style={{
          marginTop: 4,
          fontSize: 16,
          color: colors.ink[500],
        }}
      >
        정확도 {accuracy}%
      </Text>
      {commitResult && commitResult.current_streak > 0 ? (
        <View
          style={{
            marginTop: 14,
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: "#FEF3C7",
            borderRadius: 999,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="flame" size={16} color={colors.warn} strokeWidth={2.4} />
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#B45309" }}>
            연속 {commitResult.current_streak}일!
          </Text>
        </View>
      ) : null}
      <View
        style={{
          marginTop: 20,
          flexDirection: "row",
          gap: 16,
          justifyContent: "center",
        }}
      >
        <ScoreChip icon="check" label="안다" count={score.know} color={colors.success} />
        <ScoreChip icon="x" label="모른다" count={score.dont} color={colors.danger} />
      </View>
      <Pressable
        onPress={onClose}
        style={{
          marginTop: 32,
          paddingHorizontal: 28,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: colors.blue[500],
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          돌아가기
        </Text>
      </Pressable>
    </View>
  );
}

