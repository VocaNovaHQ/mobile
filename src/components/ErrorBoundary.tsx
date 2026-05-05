import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "../theme/tokens";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * 앱 최상위에서 잡히지 않은 렌더 에러를 catch.
 * 흰 화면(WSOD) 대신 친절한 에러 화면 + 다시 시도 버튼.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 향후 Crashlytics / Sentry 등 연동 시 이 자리에서 reportError 호출.
    console.warn("[ErrorBoundary]", error.message, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#fff",
            padding: 32,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: colors.ink[900],
              letterSpacing: -0.4,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            앗, 문제가 발생했어요
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.ink[500],
              textAlign: "center",
              lineHeight: 19,
              marginBottom: 24,
            }}
          >
            예상치 못한 오류로 화면을 그릴 수 없어요.{"\n"}앱을 다시 시작하면
            보통 해결됩니다.
          </Text>
          <Pressable
            onPress={this.reset}
            style={{
              height: 46,
              paddingHorizontal: 22,
              borderRadius: 12,
              backgroundColor: colors.blue[500],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
              다시 시도
            </Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
