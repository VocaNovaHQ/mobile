import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey || url.includes("YOUR-PROJECT-REF") || anonKey.includes("YOUR-ANON-KEY")) {
  // 개발 편의를 위해 throw 대신 경고 — 인증 화면에서 안내
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL / ANON_KEY 가 .env 에 설정되지 않았습니다."
  );
}

export const supabase = createClient(url ?? "https://invalid", anonKey ?? "anon", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 앱이 foreground일 때만 토큰 자동 갱신
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
