import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { Button } from "../../components";
import { signInWithApple, signInWithGoogle } from "../../lib/auth";
import { colors } from "../../theme/tokens";

export function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    const r = await signInWithGoogle();
    setLoading(false);
    if (!r.ok) {
      Alert.alert("로그인 실패", r.error);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    const r = await signInWithApple();
    setLoading(false);
    if (!r.ok && r.error !== "로그인이 취소되었습니다.") {
      Alert.alert("로그인 실패", r.error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 상단 컨텐츠 — 화면이 작으면 스크롤 */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: colors.blue[500],
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 32, fontWeight: "800" }}>
            V
          </Text>
        </View>
        <Text
          style={{
            fontSize: 36,
            fontWeight: "800",
            color: colors.ink[900],
            letterSpacing: -1,
            lineHeight: 42,
          }}
        >
          VocaNova
        </Text>
        <Text
          style={{
            marginTop: 12,
            fontSize: 16,
            color: colors.ink[500],
            fontWeight: "500",
            letterSpacing: -0.2,
            lineHeight: 24,
          }}
        >
          크롬에서 모은 단어를{"\n"}매일 30개씩 정복하세요.
        </Text>

        <View style={{ marginTop: 36, gap: 14 }}>
          <Bullet text="크롬 익스텐션과 자동 동기화" />
          <Bullet text="간격 반복(SRS)으로 효율적 암기" />
          <Bullet text="플래시카드로 즐겁게 학습" />
        </View>
      </ScrollView>

      {/* 하단 버튼 — 항상 SafeArea 위에 고정 */}
      <View
        style={{
          paddingHorizontal: 28,
          paddingTop: 16,
          paddingBottom: 16,
          gap: 10,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: colors.ink[100],
        }}
      >
        <Button
          full
          size="lg"
          variant="primary"
          onPress={handleGoogle}
          disabled={loading}
        >
          {loading ? "잠시만요…" : "Google로 시작하기"}
        </Button>
        {appleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={14}
            style={{ width: "100%", height: 56 }}
            onPress={handleApple}
          />
        ) : null}
        <Text
          style={{
            fontSize: 11,
            color: colors.ink[400],
            textAlign: "center",
            lineHeight: 16,
          }}
        >
          계속하면 서비스 이용약관과 개인정보처리방침에 동의하는 것으로
          간주됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.blue[500],
        }}
      />
      <Text style={{ fontSize: 14, color: colors.ink[700], fontWeight: "500" }}>
        {text}
      </Text>
    </View>
  );
}
