import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Icon } from "../../components";
import { colors } from "../../theme/tokens";
import {
  ensurePermission,
  formatReminderTime,
  loadReminder,
  saveReminder,
  type ReminderSettings,
} from "../../lib/notifications";
import type { RootStackScreenProps } from "../../navigation/types";

const DEFAULT: ReminderSettings = { enabled: false, hour: 18, minute: 0 };

export function ReminderScreen({ navigation }: RootStackScreenProps<"Reminder">) {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    loadReminder().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  async function persist(next: ReminderSettings) {
    setSaving(true);
    try {
      if (next.enabled) {
        const ok = await ensurePermission();
        if (!ok) {
          setPermissionDenied(true);
          setSettings({ ...next, enabled: false });
          await saveReminder({ ...next, enabled: false });
          return;
        }
        setPermissionDenied(false);
      }
      const saved = await saveReminder(next);
      setSettings(saved);
    } finally {
      setSaving(false);
    }
  }

  function shiftHour(delta: number) {
    const hour = (settings.hour + delta + 24) % 24;
    persist({ ...settings, hour });
  }

  function shiftMinute(delta: number) {
    const total = settings.hour * 60 + settings.minute + delta;
    const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
    const hour = Math.floor(wrapped / 60);
    const minute = wrapped % 60;
    persist({ ...settings, hour, minute });
  }

  const nextLabel = describeNext(settings);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.ink[50] }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
          hitSlop={8}
        >
          <Icon name="chevron-left" size={20} color={colors.ink[700]} />
        </Pressable>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: colors.ink[900],
            marginLeft: 4,
          }}
        >
          복습 알림
        </Text>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 64, alignItems: "center" }}>
          <ActivityIndicator color={colors.blue[500]} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 16 }}>
            {permissionDenied ? (
              <Card padding={14} style={{ backgroundColor: "#FEF3C7", borderColor: "transparent" }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.ink[900],
                    marginBottom: 4,
                  }}
                >
                  알림 권한이 꺼져있어요
                </Text>
                <Text style={{ fontSize: 12, color: colors.ink[700], lineHeight: 18 }}>
                  설정 앱에서 알림 권한을 허용한 뒤 다시 시도해 주세요.
                </Text>
                <Pressable
                  onPress={() => Linking.openSettings()}
                  style={{
                    marginTop: 10,
                    alignSelf: "flex-start",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: "#fff",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.warn }}>
                    설정 열기
                  </Text>
                </Pressable>
              </Card>
            ) : null}

            <Card padding={16}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      color: colors.ink[900],
                      marginBottom: 4,
                    }}
                  >
                    매일 알림
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.ink[500], lineHeight: 18 }}>
                    설정한 시각마다 학습을 알려드려요.
                  </Text>
                </View>
                <Switch
                  value={settings.enabled}
                  disabled={saving}
                  onValueChange={(v) => persist({ ...settings, enabled: v })}
                  trackColor={{ false: colors.ink[200], true: colors.blue[500] }}
                  thumbColor={Platform.OS === "android" ? "#fff" : undefined}
                />
              </View>
            </Card>

            <Card padding={18}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: colors.blue[500],
                  letterSpacing: 0.4,
                  marginBottom: 6,
                }}
              >
                알림 시각
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  marginTop: 8,
                  marginBottom: 6,
                  opacity: settings.enabled ? 1 : 0.45,
                }}
              >
                <TimeStepper
                  value={settings.hour}
                  onShift={shiftHour}
                  disabled={!settings.enabled || saving}
                />
                <Text
                  style={{
                    fontSize: 44,
                    fontWeight: "800",
                    color: colors.ink[900],
                    letterSpacing: -1,
                  }}
                >
                  :
                </Text>
                <TimeStepper
                  value={settings.minute}
                  onShift={shiftMinute}
                  disabled={!settings.enabled || saving}
                />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.ink[500],
                  textAlign: "center",
                  marginTop: 6,
                }}
              >
                {nextLabel}
              </Text>
            </Card>

            <Text
              style={{
                fontSize: 11,
                color: colors.ink[500],
                lineHeight: 16,
                paddingHorizontal: 4,
              }}
            >
              알림은 기기에 저장되어 매일 같은 시각에 반복됩니다. 시간을 변경하면 즉시 다시
              예약되며, 기기를 다시 시작해도 유지돼요.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function TimeStepper({
  value,
  onShift,
  disabled,
}: {
  value: number;
  onShift: (delta: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <StepperButton icon="chevron-up" onPress={() => onShift(1)} disabled={disabled} />
      <View
        style={{
          minWidth: 80,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 14,
          backgroundColor: colors.blue[50],
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 44,
            fontWeight: "800",
            color: colors.ink[900],
            letterSpacing: -1,
          }}
        >
          {String(value).padStart(2, "0")}
        </Text>
      </View>
      <StepperButton icon="chevron-down" onPress={() => onShift(-1)} disabled={disabled} />
    </View>
  );
}

function StepperButton({
  icon,
  onPress,
  disabled,
}: {
  icon: "chevron-up" | "chevron-down";
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={{
        width: 44,
        height: 32,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderWidth: 0.5,
        borderColor: "rgba(15,23,42,0.08)",
      }}
    >
      <Icon name={icon} size={18} color={colors.ink[700]} strokeWidth={2.4} />
    </Pressable>
  );
}

function describeNext(s: ReminderSettings): string {
  if (!s.enabled) return "알림이 꺼져 있어요";
  const now = new Date();
  const next = new Date();
  next.setHours(s.hour, s.minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  const diffMs = next.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  if (hours === 0) return `${minutes}분 후 알림 (${formatReminderTime(s)})`;
  if (hours < 24) return `${hours}시간 ${minutes}분 후 알림 (${formatReminderTime(s)})`;
  return `매일 ${formatReminderTime(s)}`;
}
