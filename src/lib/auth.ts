import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

/**
 * Supabase Google OAuth 흐름 (RN + Expo).
 * 1) supabase.auth.signInWithOAuth로 인증 URL 획득
 * 2) WebBrowser.openAuthSessionAsync 로 시스템 브라우저 + 콜백 캡처
 * 3) 콜백 URL의 fragment에서 토큰 추출 → setSession
 */
export async function signInWithGoogle(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const redirectTo = AuthSession.makeRedirectUri({
      scheme: "vocanova",
      path: "auth-callback",
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      return { ok: false, error: error?.message ?? "OAuth URL을 얻지 못했습니다." };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success" || !result.url) {
      return { ok: false, error: "로그인이 취소되었습니다." };
    }

    const parsed = Linking.parse(result.url);
    const fragment = (parsed.path?.includes("#") ? parsed.path.split("#")[1] : null) ??
      (result.url.includes("#") ? result.url.split("#")[1] : null);

    let access_token: string | undefined;
    let refresh_token: string | undefined;

    if (fragment) {
      const params = new URLSearchParams(fragment);
      access_token = params.get("access_token") ?? undefined;
      refresh_token = params.get("refresh_token") ?? undefined;
    }
    // 일부 케이스: query string에 들어올 수 있음
    if (!access_token && parsed.queryParams) {
      const q = parsed.queryParams as Record<string, string | undefined>;
      access_token = q.access_token;
      refresh_token = q.refresh_token;
    }

    if (!access_token || !refresh_token) {
      return { ok: false, error: "세션 토큰을 받지 못했습니다." };
    }

    const { error: setErr } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (setErr) return { ok: false, error: setErr.message };

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "알 수 없는 오류" };
  }
}

/**
 * Sign In with Apple — iOS 네이티브 플로우.
 * 1) raw nonce 생성 + SHA256 해시 → Apple에는 해시된 nonce 전달
 * 2) AppleAuthentication.signInAsync 로 시스템 시트 띄움
 * 3) identityToken (JWT) + raw nonce 를 Supabase signInWithIdToken 으로 교환
 *    Supabase가 raw nonce를 다시 해싱해서 토큰의 nonce와 비교 → replay 공격 방지
 */
export async function signInWithApple(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (Platform.OS !== "ios") {
    return { ok: false, error: "Apple 로그인은 iOS 에서만 지원됩니다." };
  }
  try {
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      return { ok: false, error: "이 기기에서 Apple 로그인을 사용할 수 없습니다." };
    }

    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return { ok: false, error: "Apple identity token을 받지 못했습니다." };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "ERR_REQUEST_CANCELED") {
      return { ok: false, error: "로그인이 취소되었습니다." };
    }
    return { ok: false, error: e?.message ?? "알 수 없는 오류" };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
