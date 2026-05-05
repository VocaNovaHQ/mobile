import { useEffect, useState } from "react";
import { Alert, Linking, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignInButton, Icon } from "../../components";
import type { IconName } from "../../components/Icon";
import { signInWithApple, signInWithGoogle } from "../../lib/auth";
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "../../lib/legalLinks";
import { colors, shadow } from "../../theme/tokens";

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
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 28,
        }}
      >
        {/* Brand */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <LinearGradient
            colors={[colors.blue[400], colors.blue[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              ...shadow.primary,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 24,
                fontWeight: "800",
                letterSpacing: -0.5,
              }}
            >
              V
            </Text>
          </LinearGradient>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: colors.ink[900],
              letterSpacing: -0.6,
            }}
          >
            VocaNova
          </Text>
        </View>

        {/* Headline */}
        <Text
          style={{
            fontSize: 34,
            fontWeight: "800",
            color: colors.ink[900],
            letterSpacing: -1.2,
            lineHeight: 40,
          }}
        >
          크롬에서 모은 단어,{"\n"}
          <Text style={{ color: colors.blue[500] }}>손 안에서 정복.</Text>
        </Text>
        <Text
          style={{
            marginTop: 14,
            fontSize: 15,
            color: colors.ink[600],
            fontWeight: "500",
            letterSpacing: -0.2,
            lineHeight: 22,
          }}
        >
          웹에서 발견한 영단어를 한 번의 클릭으로 저장하고{"\n"}앱에서
          플래시카드로 완벽히 외워보세요.
        </Text>

        {/* Sync hero — 크롬 익스텐션 강조 */}
        <LinearGradient
          colors={[colors.blue[500], colors.blue[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginTop: 26,
            borderRadius: 22,
            padding: 22,
            paddingVertical: 22,
            ...shadow.primary,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <DeviceTile icon="chrome" label="Chrome" sublabel="익스텐션" />
            <SyncBridge />
            <DeviceTile icon="smartphone" label="VocaNova" sublabel="iPhone" />
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.18)",
              paddingTop: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 14,
                fontWeight: "800",
                textAlign: "center",
                letterSpacing: -0.2,
              }}
            >
              크롬 익스텐션이 핵심입니다
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Bottom CTA */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 14,
          paddingBottom: 16,
          gap: 10,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: colors.ink[100],
        }}
      >
        <GoogleSignInButton onPress={handleGoogle} disabled={loading} />
        {appleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={14}
            style={{ width: "100%", height: 52 }}
            onPress={handleApple}
          />
        ) : null}
        <Text
          style={{
            fontSize: 11,
            color: colors.ink[400],
            textAlign: "center",
            lineHeight: 16,
            marginTop: 4,
          }}
        >
          계속하면{" "}
          <Text
            style={{ color: colors.blue[500], fontWeight: "600" }}
            onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
          >
            서비스 이용약관
          </Text>
          과{" "}
          <Text
            style={{ color: colors.blue[500], fontWeight: "600" }}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          >
            개인정보처리방침
          </Text>
          에{"\n"}동의하는 것으로 간주됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Components ──────────────────────────────────────

function DeviceTile({
  icon,
  label,
  sublabel,
}: {
  icon: IconName;
  label: string;
  sublabel: string;
}) {
  return (
    <View style={{ alignItems: "center", gap: 6, width: 78 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: "rgba(255,255,255,0.18)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.25)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={28} color="#fff" strokeWidth={2} />
      </View>
      <Text
        style={{
          color: "#fff",
          fontSize: 12,
          fontWeight: "800",
          letterSpacing: -0.2,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.2,
          marginTop: -2,
        }}
      >
        {sublabel}
      </Text>
    </View>
  );
}

function SyncBridge() {
  return (
    <View style={{ alignItems: "center", flex: 1, gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Dot />
        <Dot />
        <Dot />
        <Icon
          name="arrow-right"
          size={16}
          color="rgba(255,255,255,0.95)"
          strokeWidth={2.6}
        />
      </View>
      <Text
        style={{
          color: "rgba(255,255,255,0.95)",
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 0.6,
        }}
      >
        SYNC
      </Text>
    </View>
  );
}

function Dot() {
  return (
    <View
      style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.7)",
      }}
    />
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: IconName;
  title: string;
  desc: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          backgroundColor: colors.blue[50],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          name={icon}
          size={18}
          color={colors.blue[500]}
          strokeWidth={2.2}
        />
      </View>
      <View style={{ flex: 1, paddingTop: 1 }}>
        <Text
          style={{
            fontSize: 14.5,
            fontWeight: "700",
            color: colors.ink[900],
            letterSpacing: -0.2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 12.5,
            color: colors.ink[500],
            lineHeight: 18,
            marginTop: 2,
          }}
        >
          {desc}
        </Text>
      </View>
    </View>
  );
}
