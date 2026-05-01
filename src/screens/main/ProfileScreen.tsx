import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AppHeader,
  Avatar,
  Button,
  Card,
  Chip,
  Icon,
  StatsBody,
} from "../../components";
import { colors } from "../../theme/tokens";
import { useCurrentUser } from "../../store/auth";
import { signOut } from "../../lib/auth";
import { formatReminderTime, loadReminder, type ReminderSettings } from "../../lib/notifications";
import { fetchStats, type StatsSummary } from "../../lib/stats";
import type { IconName } from "../../components/Icon";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = "profile" | "stats";

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const user = useCurrentUser();
  const name = user?.user_metadata?.full_name?.split(" ")[0] ?? "지훈";
  const initial = name.slice(0, 1) || "지";
  const email = user?.email ?? "demo@vocanova.app";

  const [tab, setTab] = useState<Tab>("profile");

  const [reminder, setReminder] = useState<ReminderSettings | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadReminder().then((s) => {
        if (active) setReminder(s);
      });
      return () => {
        active = false;
      };
    }, [])
  );
  const reminderValue = reminder
    ? reminder.enabled
      ? formatReminderTime(reminder)
      : "꺼짐"
    : "—";

  // 통계 — 처음 통계 탭으로 갈 때 lazy load
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setStatsError(null);
      const s = await fetchStats();
      setStats(s);
    } catch (e: any) {
      setStatsError(e?.message ?? "통계를 불러오지 못했습니다");
    }
  }, []);

  useEffect(() => {
    if (tab === "stats" && !stats && !statsError) {
      loadStats();
    }
  }, [tab, stats, statsError, loadStats]);

  const onRefresh = useCallback(async () => {
    if (tab !== "stats") return;
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [tab, loadStats]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.ink[50] }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          tab === "stats" ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.blue[500]}
            />
          ) : undefined
        }
      >
        <AppHeader
          title={tab === "stats" ? "통계" : "프로필"}
          subtitle={tab === "stats" ? "학습 기록" : undefined}
          big
          trailing={
            tab === "profile" ? (
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
                <Icon name="settings" size={20} color={colors.ink[700]} />
              </Pressable>
            ) : undefined
          }
        />

        <SegmentedTabs value={tab} onChange={setTab} />

        {tab === "profile" ? (
          <ProfileBody
            name={name}
            initial={initial}
            email={email}
            reminderValue={reminderValue}
            onReminderPress={() => navigation.navigate("Reminder")}
            onSchedulePress={() => navigation.navigate("Schedule")}
          />
        ) : (
          <StatsTab
            stats={stats}
            error={statsError}
            onRetry={loadStats}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Tabs ────────────────────────────────

function SegmentedTabs({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (v: Tab) => void;
}) {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 4,
        flexDirection: "row",
        backgroundColor: colors.ink[100],
        borderRadius: 12,
      }}
    >
      <SegmentItem
        label="프로필"
        active={value === "profile"}
        onPress={() => onChange("profile")}
      />
      <SegmentItem
        label="통계"
        active={value === "stats"}
        onPress={() => onChange("stats")}
      />
    </View>
  );
}

function SegmentItem({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 9,
        alignItems: "center",
        borderRadius: 9,
        backgroundColor: active ? "#fff" : "transparent",
        shadowColor: active ? "#0F172A" : undefined,
        shadowOpacity: active ? 0.05 : 0,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: active ? 1 : 0,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: active ? colors.ink[900] : colors.ink[500],
          letterSpacing: -0.1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Profile body ────────────────────────────────

function ProfileBody({
  name,
  initial,
  email,
  reminderValue,
  onReminderPress,
  onSchedulePress,
}: {
  name: string;
  initial: string;
  email: string;
  reminderValue: string;
  onReminderPress: () => void;
  onSchedulePress: () => void;
}) {
  return (
    <>
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <Card padding={18}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Avatar
              initial={initial}
              color="#FF7A45"
              size={60}
              ring={colors.blue[500]}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 19,
                  fontWeight: "800",
                  color: colors.ink[900],
                  letterSpacing: -0.3,
                }}
              >
                {name}
              </Text>
              <Text style={{ fontSize: 13, color: colors.ink[500], marginTop: 2 }}>
                {email}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Chip color={colors.blue[600]} bg={colors.chip} size="sm">
                  Pro
                </Chip>
                <Chip color={colors.warn} bg="#FEF3C7" size="sm">
                  🔥 12일
                </Chip>
              </View>
            </View>
          </View>

          <View
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 0.5,
              borderTopColor: "rgba(15,23,42,0.05)",
              flexDirection: "row",
              gap: 10,
            }}
          >
            {(
              [
                { l: "단어", v: "248" },
                { l: "랭킹", v: "4위" },
                { l: "총 XP", v: "4.2k" },
              ] as const
            ).map((s) => (
              <View key={s.l} style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: colors.ink[900],
                  }}
                >
                  {s.v}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.ink[500],
                    fontWeight: "600",
                    marginTop: 2,
                  }}
                >
                  {s.l}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Group title="학습 환경">
          <Row
            icon="bell"
            title="복습 알림"
            value={reminderValue}
            onPress={onReminderPress}
          />
          <Row icon="bolt" title="복습 일정" onPress={onSchedulePress} />
          <Row icon="globe" title="언어" value="한국어" last />
        </Group>

        <Group title="크롬 익스텐션">
          <Row
            icon="cards"
            title="익스텐션 동기화"
            badge={
              <Chip color={colors.success} bg="#D1FAE5" size="sm">
                연결됨
              </Chip>
            }
          />
          <Row icon="sparkles" title="자동 저장 규칙" last />
        </Group>

        <Group title="계정">
          <Row icon="user" title="계정 정보" />
          <Row
            icon="heart"
            title="구독 관리"
            badge={
              <Chip color={colors.blue[600]} bg={colors.chip} size="sm">
                Pro
              </Chip>
            }
            last
          />
        </Group>

        <Pressable
          onPress={signOut}
          style={{
            marginTop: 4,
            padding: 14,
            borderRadius: 12,
            backgroundColor: "#fff",
            alignItems: "center",
            borderWidth: 0.5,
            borderColor: "rgba(15,23,42,0.05)",
          }}
        >
          <Text
            style={{ fontSize: 14, fontWeight: "700", color: colors.danger }}
          >
            로그아웃
          </Text>
        </Pressable>
      </View>
    </>
  );
}

// ─── Stats body wrapper (loading/error/data) ──────────

function StatsTab({
  stats,
  error,
  onRetry,
}: {
  stats: StatsSummary | null;
  error: string | null;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
        <Card padding={18}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: colors.ink[900],
              marginBottom: 12,
            }}
          >
            {error}
          </Text>
          <Button variant="secondary" onPress={onRetry}>
            다시 시도
          </Button>
        </Card>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={{ paddingVertical: 64, alignItems: "center" }}>
        <ActivityIndicator color={colors.blue[500]} />
      </View>
    );
  }

  return <StatsBody stats={stats} />;
}

// ─── helpers ────────────────────────────────

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: colors.ink[500],
          letterSpacing: 0.6,
          paddingHorizontal: 6,
          paddingBottom: 8,
        }}
      >
        {title}
      </Text>
      <Card padding={0}>{children}</Card>
    </View>
  );
}

function Row({
  icon,
  title,
  value,
  last,
  badge,
  color,
  onPress,
}: {
  icon: IconName;
  title: string;
  value?: string;
  last?: boolean;
  badge?: React.ReactNode;
  color?: string;
  onPress?: () => void;
}) {
  const iconColor = color ?? colors.blue[500];
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: "rgba(15,23,42,0.05)",
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          backgroundColor: iconColor + "20",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: "600",
          color: colors.ink[900],
        }}
      >
        {title}
      </Text>
      {badge}
      {value ? (
        <Text style={{ fontSize: 13, color: colors.ink[500], marginRight: 4 }}>
          {value}
        </Text>
      ) : null}
      <Icon name="chevron-right" size={16} color={colors.ink[500]} />
    </Pressable>
  );
}
