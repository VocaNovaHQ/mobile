import { Text, View } from "react-native";
import { Card } from "./Card";
import { Icon, type IconName } from "./Icon";
import { SectionHeader } from "./SectionHeader";
import { colors } from "../theme/tokens";
import type { StatsSummary } from "../lib/stats";

export type StatsBodyProps = {
  stats: StatsSummary;
};

export function StatsBody({ stats }: StatsBodyProps) {
  const { total, byStatus, addedThisWeek, thisWeekReviews, todayReviews, streak, daily } = stats;
  const masteryPct = total > 0 ? Math.round((byStatus.mastered / total) * 100) : 0;

  const dailyMax = Math.max(1, ...daily.map((d) => d.count));
  const dailySum = daily.reduce((acc, d) => acc + d.count, 0);
  const dailyAvg = Math.round(dailySum / daily.length);

  const breakdown = [
    {
      label: "완료",
      count: byStatus.mastered,
      pct: total > 0 ? byStatus.mastered / total : 0,
      color: colors.success,
    },
    {
      label: "학습 중",
      count: byStatus.learning,
      pct: total > 0 ? byStatus.learning / total : 0,
      color: colors.blue[500],
    },
    {
      label: "학습 전",
      count: byStatus.new,
      pct: total > 0 ? byStatus.new / total : 0,
      color: colors.warn,
    },
  ] as const;

  const badges = [
    { icon: "flame" as const, label: "7일 연속", on: streak >= 7 },
    { icon: "trophy" as const, label: "100단어", on: total >= 100 },
    { icon: "bolt" as const, label: "30일 연속", on: streak >= 30 },
    { icon: "brain" as const, label: "마스터 50", on: byStatus.mastered >= 50 },
  ];

  return (
    <>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 16,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <BigStatBox
          label="총 단어"
          value={String(total)}
          caption={addedThisWeek > 0 ? `+${addedThisWeek} 이번 주` : "이번 주 신규 없음"}
          color={colors.blue[500]}
        />
        <BigStatBox
          label="암기율"
          value={`${masteryPct}%`}
          caption={`${byStatus.mastered}/${total} 완료`}
          color={colors.success}
        />
        <BigStatBox
          label="연속 학습"
          value={`${streak}일`}
          caption={todayReviews > 0 ? `오늘 ${todayReviews}회 복습` : "오늘 학습 전"}
          color={colors.warn}
          icon="flame"
        />
        <BigStatBox
          label="이번 주 복습"
          value={String(thisWeekReviews)}
          caption="최근 7일 누적"
          color={colors.blue[500]}
        />
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Card padding={18}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: colors.blue[500],
                  letterSpacing: 0.4,
                }}
              >
                최근 14일
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: colors.ink[900],
                  marginTop: 2,
                }}
              >
                일일 복습 횟수
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ink[500] }}>
              평균 {dailyAvg}회/일
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 4,
              height: 110,
            }}
          >
            {daily.map((d, i) => {
              const isLast = i === daily.length - 1;
              const heightPct = (d.count / dailyMax) * 100;
              return (
                <View
                  key={d.date}
                  style={{
                    flex: 1,
                    height: `${heightPct}%`,
                    minHeight: 6,
                    backgroundColor: isLast ? colors.blue[500] : colors.blue[100],
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    borderBottomLeftRadius: 2,
                    borderBottomRightRadius: 2,
                    position: "relative",
                  }}
                >
                  {isLast && d.count > 0 ? (
                    <Text
                      style={{
                        position: "absolute",
                        top: -22,
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        fontSize: 10,
                        fontWeight: "800",
                        color: colors.blue[600],
                      }}
                    >
                      {d.count}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
          {dailySum === 0 ? (
            <Text
              style={{
                marginTop: 12,
                fontSize: 12,
                color: colors.ink[500],
                textAlign: "center",
              }}
            >
              아직 복습 기록이 없어요
            </Text>
          ) : null}
        </Card>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Card padding={18}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: colors.ink[900],
              marginBottom: 14,
            }}
          >
            암기 단계 분포
          </Text>
          {breakdown.map((r) => (
            <View key={r.label} style={{ marginBottom: 14 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.ink[700] }}>
                  {r.label}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink[900] }}>
                  {r.count}
                  <Text style={{ color: colors.ink[500], fontWeight: "500" }}>
                    {" "}
                    ({Math.round(r.pct * 100)}%)
                  </Text>
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  backgroundColor: colors.ink[100],
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${r.pct * 100}%`,
                    height: "100%",
                    backgroundColor: r.color,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          ))}
        </Card>
      </View>

      <SectionHeader title="달성한 배지" />
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          gap: 8,
        }}
      >
        {badges.map((b) => (
          <View
            key={b.label}
            style={{
              flex: 1,
              backgroundColor: b.on ? colors.blue[50] : "#fff",
              borderWidth: 0.5,
              borderColor: "rgba(15,23,42,0.05)",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              opacity: b.on ? 1 : 0.5,
            }}
          >
            <Icon
              name={b.icon as IconName}
              size={28}
              color={b.on ? colors.blue[500] : colors.ink[400]}
              strokeWidth={2}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.ink[700],
                marginTop: 6,
              }}
            >
              {b.label}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

function BigStatBox({
  label,
  value,
  caption,
  color,
  icon,
}: {
  label: string;
  value: string;
  caption: string;
  color: string;
  icon?: IconName;
}) {
  return (
    <View style={{ flexBasis: "48%", flexGrow: 1 }}>
      <Card padding={14}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          {icon ? <Icon name={icon} size={14} color={color} strokeWidth={2.4} /> : null}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.ink[500],
              letterSpacing: 0.4,
            }}
          >
            {label.toUpperCase()}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 26,
            fontWeight: "800",
            color: colors.ink[900],
            letterSpacing: -0.6,
          }}
        >
          {value}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color,
            fontWeight: "600",
            marginTop: 2,
          }}
        >
          {caption}
        </Text>
      </Card>
    </View>
  );
}
