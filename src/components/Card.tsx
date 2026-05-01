import { View, type ViewProps, type ViewStyle } from "react-native";
import { radius, shadow } from "../theme/tokens";

export type CardProps = ViewProps & {
  padding?: number;
  dark?: boolean;
  style?: ViewStyle;
};

export function Card({
  children,
  padding = 16,
  dark = false,
  style,
  ...rest
}: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: dark ? "rgba(255,255,255,0.05)" : "#fff",
          borderRadius: radius.lg,
          padding,
          borderWidth: 0.5,
          borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
        },
        !dark && shadow.card,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
