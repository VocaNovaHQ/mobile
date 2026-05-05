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

    // Apple은 fullName을 첫 로그인 시에만 제공 → user_metadata에 저장.
    // 두 번째 로그인부터는 credential.fullName === null 이므로 덮어쓰기 방지 위해
    // 실제 이름이 있을 때만 update.
    const fullName = formatAppleFullName(credential.fullName);
    if (fullName) {
      await supabase.auth
        .updateUser({ data: { full_name: fullName } })
        .catch(() => {
          // 이름 저장 실패는 로그인 자체를 막지 않음 — 무시
        });
    }
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

/**
 * 현재 로그인된 사용자의 계정 + 모든 데이터를 영구 삭제.
 * Supabase RPC delete_my_account 호출 → auth.users row 제거 → 자동 로그아웃.
 * Apple App Review Guideline 5.1.1(v) 대응.
 */
export async function deleteMyAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await supabase.rpc("delete_my_account");
    if (error) return { ok: false, error: error.message };
    // auth.users 삭제 후 토큰은 무효화됐지만 클라이언트 세션은 명시적으로 정리.
    await supabase.auth.signOut().catch(() => {});
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "알 수 없는 오류" };
  }
}

/**
 * Apple credential.fullName ({ givenName, familyName, ... }) → 단일 문자열.
 * 한국식: familyName + givenName, 영미식: givenName + familyName.
 * 둘 다 비어있으면 null.
 */
function formatAppleFullName(
  full: AppleAuthentication.AppleAuthenticationFullName | null
): string | null {
  if (!full) return null;
  const given = full.givenName?.trim() ?? "";
  const family = full.familyName?.trim() ?? "";
  if (!given && !family) return null;
  // 한국어 사용자가 다수면 family + given 이 더 자연스러움.
  // 단, given이나 family 중 하나만 있으면 그것만 반환.
  if (!family) return given;
  if (!given) return family;
  // 한국어 이름 휴리스틱: family가 1~2자 한글이면 한국식 결합.
  const isKoreanFamily = /^[가-힣]{1,2}$/.test(family);
  return isKoreanFamily ? `${family}${given}` : `${given} ${family}`;
}
