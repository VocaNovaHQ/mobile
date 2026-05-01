import { ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AppHeader,
  Button,
  Card,
  Chip,
  Icon,
  SectionHeader,
} from "../../components";
import { colors } from "../../theme/tokens";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SLOTS: {
  time: string;
  count: number;
  label: string;
  urgent?: boolean;
  words: string[];
}[] = [
  { time: "오늘 오후 6:00", count: 24, label: "복습", urgent: true, words: ["common", "profound", "serendipity"] },
  { time: "내일 오전 9:00", count: 18, label: "복습", words: ["mitigate", "verbose"] },
  { time: "내일 오후 8:00", count: 12, label: "신규", words: ["ubiquitous", "pragmatic"] },
  { time: "4월 28일", count: 8, label: "복습", words: ["concise"] },
  { time: "5월 1일", count: 14, label: "복습", words: ["resilient"] },
];

export function ScheduleScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.ink[50] }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader title="복습 일정" subtitle="SRS · 간격 반복" big />

        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 }}>
          <Card padding={0} style={{ overflow: "hidden", borderColor: "transparent" }}>
            <LinearGradient
              colors={[colors.blue[500], "#6B8EFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 18 }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.85)",
                  letterSpacing: 0.5,
                }}
              >
                다음 복습
              </Text>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "800",
                  color: "#fff",
                  marginTop: 4,
                  letterSpacing: -0.4,
                }}
              >
                오늘 오후 6:00
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.9)",
                  marginTop: 2,
                }}
              >
                24개 단어가 복습을 기다리고 있어요
              </Text>
              <View style={{ marginTop: 14, alignSelf: "flex-start" }}>
                <Button
                  variant="secondary"
                  icon="bolt"
                  onPress={() => navigation.navigate("Study", {})}
                  style={{ backgroundColor: "#fff" }}
                >
                  지금 복습하기
                </Button>
              </View>
            </LinearGradient>
          </Card>
        </View>

        <SectionHeader title="예정된 복습" />

        <View style={{ paddingHorizontal: 20, paddingBottom: 30 }}>
          <View style={{ position: "relative" }}>
            {/* timeline rail */}
            <View
              style={{
                position: "absolute",
                left: 14,
                top: 8,
                bottom: 16,
                width: 2,
                backgroundColor: colors.ink[200],
              }}
            />
            {SLOTS.map((s, i) => (
              <View
                key={i}
                style={{
                  position: "relative",
                  paddingLeft: 36,
                  marginBottom: 12,
                }}
              >
                {/* dot */}
                <View
                  style={{
                    position: "absolute",
                    left: 8,
                    top: 12,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: s.urgent ? colors.blue[500] : colors.ink[200],
                    borderWidth: 2.5,
                    borderColor: colors.ink[50],
                    zIndex: 1,
                    ...(s.urgent
                      ? {
                          shadowColor: colors.blue[500],
                          shadowOpacity: 0.18,
                          shadowOffset: { width: 0, height: 0 },
                          shadowRadius: 4,
                          elevation: 4,
                        }
                      : {}),
                  }}
                />
                <Card padding={14}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: s.urgent ? colors.blue[500] : colors.ink[500],
                          letterSpacing: 0.4,
                        }}
                      >
                        {s.time.toUpperCase()}
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "800",
                          color: colors.ink[900],
                          marginTop: 2,
                        }}
                      >
                        {s.count}개 · {s.label}
                      </Text>
                    </View>
                    <Chip
                      color={s.urgent ? colors.blue[600] : colors.ink[500]}
                      bg={s.urgent ? colors.chip : colors.ink[100]}
                      size="sm"
                    >
                      {s.label}
                    </Chip>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 6,
                      flexWrap: "wrap",
                      marginTop: 10,
                      alignItems: "center",
                    }}
                  >
                    {s.words.map((w) => (
                      <Text
                        key={w}
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: colors.ink[700],
                          paddingVertical: 3,
                          paddingHorizontal: 8,
                          borderRadius: 6,
                          backgroundColor: colors.ink[50],
                          fontStyle: "italic",
                        }}
                      >
                        {w}
                      </Text>
                    ))}
                    {s.count > s.words.length ? (
                      <Text style={{ fontSize: 12, color: colors.ink[500] }}>
                        +{s.count - s.words.length}개
                      </Text>
                    ) : null}
                  </View>
                </Card>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
