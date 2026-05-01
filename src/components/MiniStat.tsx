import { Text, View } from "react-native";
import { colors } from "../theme/tokens";

export type MiniStatProps = {
  label: string;
  value: string | number;
  accent?: string;
};

export function MiniStat({ label, value, accent = colors.blue[500] }: MiniStatProps) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          color: accent,
          letterSpacing: -0.6,
          lineHeight: 26,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.ink[500],
          fontWeight: "600",
          marginTop: 2,
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
