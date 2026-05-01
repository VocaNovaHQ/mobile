import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const STORAGE_KEY = "reminder.settings.v1";
const NOTIFICATION_ID_KEY = "reminder.notificationId.v1";

export type ReminderSettings = {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
};

const DEFAULT: ReminderSettings = { enabled: false, hour: 18, minute: 0 };

let handlerInstalled = false;
function ensureHandler() {
  if (handlerInstalled) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerInstalled = true;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("study-reminder", {
    name: "복습 알림",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
  });
}

export async function loadReminder(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      hour: clampInt(parsed.hour, 0, 23, DEFAULT.hour),
      minute: clampInt(parsed.minute, 0, 59, DEFAULT.minute),
    };
  } catch {
    return DEFAULT;
  }
}

export async function ensurePermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function saveReminder(
  settings: ReminderSettings
): Promise<ReminderSettings> {
  ensureHandler();
  const normalized: ReminderSettings = {
    enabled: !!settings.enabled,
    hour: clampInt(settings.hour, 0, 23, DEFAULT.hour),
    minute: clampInt(settings.minute, 0, 59, DEFAULT.minute),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  await reschedule(normalized);
  return normalized;
}

async function cancelExisting() {
  const existingId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
  if (existingId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    } catch {
      // already gone — ignore
    }
    await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
  }
}

async function reschedule(settings: ReminderSettings) {
  await cancelExisting();
  if (!settings.enabled) return;
  await ensureAndroidChannel();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "오늘의 단어 복습",
      body: "복습할 시간이에요. 오늘도 가보자고 💪",
      sound: "default",
      ...(Platform.OS === "android" ? { channelId: "study-reminder" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.hour,
      minute: settings.minute,
    },
  });
  await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id);
}

export function formatReminderTime(s: ReminderSettings): string {
  const hh = String(s.hour).padStart(2, "0");
  const mm = String(s.minute).padStart(2, "0");
  return `${hh}:${mm}`;
}

function clampInt(v: any, lo: number, hi: number, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}
