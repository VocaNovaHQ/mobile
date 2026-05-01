import { Text, View, type ViewStyle } from "react-native";
import { colors } from "../theme/tokens";

export type AppHeaderProps = {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  big?: boolean;
  dark?: boolean;
  style?: ViewStyle;
  /** @deprecated SafeAreaView가 외곽에서 처리. 호환성 위해 남김. */
  statusBarPad?: boolean;
};

export function AppHeader({
  title,
  subtitle,
  leading,
  trailing,
  big,
  dark,
  style,
}: AppHeaderProps) {
  const text = dark ? "#fff" : colors.ink[900];

  return (
    <View
      style={[
        {
          paddingTop: 12,
          paddingBottom: big ? 16 : 12,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: big ? "flex-end" : "center",
          justifyContent: "space-between",
          gap: 8,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          flex: 1,
          minWidth: 0,
        }}
      >
        {leading}
        <View style={{ minWidth: 0, flex: 1 }}>
          {subtitle ? (
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: dark ? colors.ink[400] : colors.ink[500],
                fontWeight: "500",
                letterSpacing: 0.2,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
          <Text
            numberOfLines={1}
            style={{
              fontSize: big ? 28 : 18,
              fontWeight: big ? "800" : "700",
              color: text,
              letterSpacing: -0.4,
            }}
          >
            {title}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {trailing}
      </View>
    </View>
  );
}
