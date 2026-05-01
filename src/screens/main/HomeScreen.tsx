import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AppHeader,
  Avatar,
  Button,
  Card,
  Icon,
  Ring,
  SectionHeader,
} from "../../components";
import { colors } from "../../theme/tokens";
import { loadWords } from "../../lib/dataSource";
import {
  fetchStats,
  loadThisWeekActivity,
  thisWeekDayKeys,
  kstTodayKey,
  type StatsSummary,
} from "../../lib/stats";
import { SAMPLE_FRIENDS } from "../../data/sample";
import { useCurrentUser } from "../../store/auth";
import type { RootStackParamList } from "../../navigation/types";
import type { Word } from "../../types/word";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useCurrentUser();
  const [words, setWords] = useState<Word[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [w, s, a] = await Promise.all([
        loadWords(),
        fetchStats().catch(() => null),
        loadThisWeekActivity().catch(() => new Set<string>()),
      ]);
      setWords(w);
      setStats(s);
      setActiveDates(a);
    } catch (e: any) {
      setError(e?.message ?? "단어를 불러오지 못했습니다");
      setWords([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const recent = (words ?? []).slice(0, 4);
  const totalCount = words?.length ?? 0;
  const userName = pickDisplayName(user);
  const initial = userName.slice(0, 1).toUpperCase();
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined);

  const isLoading = words === null && !error;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.ink[50] }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.blue[500]}
          />
        }
      >
        <AppHeader
          title={`안녕, ${userName}`}
          subtitle={formatToday()}
          leading={
            <Avatar
              initial={initial}
              color="#FF7A45"
              size={40}
              source={avatarUrl}
            />
          }
          trailing={<RoundIconButton icon="bell" />}
        />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={fetchData} />
        ) : null}

        {/* Streak banner */}
        {!isLoading && !error ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Card padding={16} style={{ backgroundColor: colors.blue[50], borderColor: "transparent" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <Icon name="flame" size={18} color={colors.blue[500]} strokeWidth={2.4} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: colors.blue[600],
                      letterSpacing: 0.5,
                    }}
                  >
                    STREAK
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "800",
                    color: colors.ink[900],
                    letterSpacing: -1,
                  }}
                >
                  {stats?.streak ?? 0}
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      opacity: 0.7,
                    }}
                  >
                    {" "}일
                  </Text>
                </Text>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 13,
                    color: colors.ink[600],
                    marginTop: 4,
                  }}
                >
                  {streakMessage(stats, activeDates)}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 4, flexShrink: 0 }}>
                {(() => {
                  const labels = ["월", "화", "수", "목", "금", "토", "일"];
                  const keys = thisWeekDayKeys();
                  const today = kstTodayKey();
                  return labels.map((d, i) => {
                    const dayKey = keys[i]!;
                    const done = activeDates.has(dayKey);
                    const isToday = dayKey === today;
                    const isFuture = dayKey > today;
                    return (
                      <View key={d} style={{ alignItems: "center", gap: 4 }}>
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: done
                              ? colors.blue[500]
                              : isFuture
                                ? colors.ink[100]
                                : colors.ink[200],
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: isToday && !done ? 1.5 : 0,
                            borderColor: colors.blue[500],
                          }}
                        >
                          {done ? (
                            <Icon name="check" size={12} color="#fff" strokeWidth={3} />
                          ) : null}
                        </View>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: isToday ? "700" : "600",
                            color: isToday ? colors.blue[600] : colors.ink[500],
                          }}
                        >
                          {d}
                        </Text>
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          </Card>
        </View>
        ) : null}

        {/* Today's mission — 실제 user_words 기반 통계 */}
        {!isLoading && !error ? (
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Card padding={20}>
              <TodaysMission words={words ?? []} onStart={() => navigation.navigate("Study", {})} />
            </Card>
          </View>
        ) : null}

        {/* Recent words */}
        {!isLoading && !error ? (
          <SectionHeader
            title="최근 저장한 단어"
            action={totalCount > 4 ? "모두 보기" : undefined}
            onActionPress={() =>
              navigation.getParent()?.navigate("Main" as any, {
                screen: "List",
              } as any)
            }
          />
        ) : null}
        {!isLoading && !error && recent.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <Card padding={24} style={{ alignItems: "center" }}>
              <Icon name="layers" size={36} color={colors.ink[300]} />
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 15,
                  fontWeight: "700",
                  color: colors.ink[700],
                }}
              >
                아직 저장된 단어가 없어요
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: colors.ink[500],
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                크롬 익스텐션에서 영단어를 드래그해서{"\n"}단어장에 추가해보세요.
              </Text>
            </Card>
          </View>
        ) : null}
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          {recent.map((w) => (
            <Pressable
              key={w.id}
              onPress={() => navigation.navigate("Detail", { wordId: w.id })}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 12,
                paddingHorizontal: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 0.5,
                borderColor: "rgba(15,23,42,0.05)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.blue[50],
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      fontSize: 16,
                      color: colors.blue[600],
                    }}
                  >
                    {w.snapshot.word[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: colors.ink[900],
                      letterSpacing: -0.2,
                    }}
                  >
                    {w.snapshot.word}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.ink[500],
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    <Text style={{ color: colors.blue[500], fontWeight: "600" }}>
                      {w.snapshot.partsOfSpeech[0]?.pos ?? "단어"}
                    </Text>
                    {" · "}
                    {w.snapshot.partsOfSpeech[0]?.meanings[0]?.definition ?? ""}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color={colors.ink[400]} />
            </Pressable>
          ))}
        </View>

        {/* Friends */}
        {!isLoading && !error ? (
        <View>
        <SectionHeader title="친구와 경쟁" action="전체" />
        <View style={{ paddingHorizontal: 20, paddingBottom: 30 }}>
          <Card padding={14}>
            {SAMPLE_FRIENDS.slice(0, 3).map((f, i) => (
              <View
                key={f.name}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  borderBottomWidth: i < 2 ? 0.5 : 0,
                  borderBottomColor: colors.ink[100],
                }}
              >
                <Text
                  style={{
                    width: 22,
                    fontSize: 13,
                    fontWeight: "800",
                    color: i === 0 ? colors.warn : colors.ink[600],
                  }}
                >
                  {f.rank}
                </Text>
                <Avatar initial={f.initial} color={f.color} size={32} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.ink[900],
                  }}
                >
                  {f.name}
                  {f.me ? " (나)" : ""}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.blue[500],
                  }}
                >
                  {f.xp.toLocaleString()} XP
                </Text>
              </View>
            ))}
          </Card>
        </View>
        </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        padding: 10,
        paddingHorizontal: 8,
        borderRadius: 10,
        backgroundColor: accent ? colors.blue[50] : colors.ink[50],
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "800",
          color: accent ? colors.blue[500] : colors.ink[900],
          letterSpacing: -0.4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10.5,
          color: colors.ink[500],
          fontWeight: "600",
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function RoundIconButton({ icon }: { icon: any }) {
  return (
    <Pressable
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#0F172A",
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <Icon name={icon} size={20} color={colors.ink[700]} />
    </Pressable>
  );
}

function formatToday(): string {
  const d = new Date();
  return d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function streakMessage(
  stats: StatsSummary | null,
  activeDates: Set<string>
): string {
  const today = kstTodayKey();
  const streak = stats?.streak ?? 0;
  const todayDone = activeDates.has(today);

  if (streak === 0) return "오늘 학습을 시작해 볼까요?";
  if (todayDone) {
    if (streak === 1) return "오늘 학습 완료! 내일도 가즈아 💪";
    return `${streak}일 연속! 멈추지 마세요 🔥`;
  }
  if (streak >= 7) return `${streak}일 streak이 깨질 위기에요 ⏰`;
  return `오늘도 한 번! ${streak}일째 가는 중 💪`;
}

function pickDisplayName(user: ReturnType<typeof useCurrentUser>): string {
  if (!user) return "친구";
  const meta = user.user_metadata as Record<string, string | undefined> | undefined;
  const fullName = meta?.full_name ?? meta?.name;
  if (fullName) return fullName.split(" ")[0]!;
  if (user.email) return user.email.split("@")[0]!;
  return "친구";
}

function TodaysMission({
  words,
  onStart,
}: {
  words: Word[];
  onStart: () => void;
}) {
  const now = Date.now();
  const dueCount = words.filter((w) => {
    const t = w.user_word?.srs_due_at;
    if (!t) return true;
    return new Date(t).getTime() <= now;
  }).length;
  const newCount = words.filter((w) => w.user_word?.status === "new").length;
  const masteredCount = words.filter(
    (w) => w.user_word?.status === "mastered"
  ).length;
  const total = words.length;
  const ratio = total > 0 ? masteredCount / total : 0;

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colors.blue[500],
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            오늘의 학습
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: colors.ink[900],
              letterSpacing: -0.4,
            }}
          >
            {total === 0
              ? "단어를 추가해보세요"
              : `복습 ${dueCount}개 · 신규 ${newCount}개`}
          </Text>
        </View>
        <Ring value={ratio} size={48} stroke={5}>
          <Text style={{ fontSize: 11, fontWeight: "800", color: colors.blue[500] }}>
            {Math.round(ratio * 100)}%
          </Text>
        </Ring>
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
        <MiniStatBox label="복습 대기" value={String(dueCount)} accent />
        <MiniStatBox label="신규" value={String(newCount)} />
        <MiniStatBox label="완료" value={String(masteredCount)} />
      </View>
      <Button
        variant="primary"
        size="md"
        full
        icon="bolt"
        onPress={onStart}
        disabled={dueCount === 0}
      >
        {dueCount === 0 ? "복습할 단어 없음" : "학습 시작하기"}
      </Button>
    </>
  );
}

function LoadingState() {
  return (
    <View
      style={{
        paddingVertical: 60,
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color={colors.blue[500]} />
      <Text
        style={{
          marginTop: 12,
          fontSize: 13,
          color: colors.ink[500],
          fontWeight: "500",
        }}
      >
        단어를 불러오는 중…
      </Text>
    </View>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
      <Card padding={20} style={{ alignItems: "center" }}>
        <Icon name="x" size={36} color={colors.danger} strokeWidth={2.4} />
        <Text
          style={{
            marginTop: 10,
            fontSize: 15,
            fontWeight: "700",
            color: colors.ink[900],
          }}
        >
          단어를 불러오지 못했습니다
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontSize: 12,
            color: colors.ink[500],
            textAlign: "center",
          }}
        >
          {error}
        </Text>
        <View style={{ marginTop: 14 }}>
          <Button variant="secondary" size="sm" icon="refresh" onPress={onRetry}>
            다시 시도
          </Button>
        </View>
      </Card>
    </View>
  );
}
