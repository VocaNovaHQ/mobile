import { Text, View, type ViewStyle } from "react-native";
import { colors } from "../theme/tokens";

export type ChipSize = "sm" | "md" | "lg";

const SIZE_TOKENS: Record<ChipSize, { padV: number; padH: number; fs: number; r: number }> = {
  sm: { padV: 3, padH: 8, fs: 11, r: 6 },
  md: { padV: 4, padH: 10, fs: 12, r: 8 },
  lg: { padV: 6, padH: 12, fs: 13, r: 10 },
};

export type ChipProps = {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  size?: ChipSize;
  style?: ViewStyle;
};

export function Chip({
  children,
  color = colors.blue[500],
  bg = colors.chip,
  size = "md",
  style,
}: ChipProps) {
  const s = SIZE_TOKENS[size];
  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          paddingVertical: s.padV,
          paddingHorizontal: s.padH,
          borderRadius: s.r,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: s.fs,
          fontWeight: "700",
          letterSpacing: 0.4,
          color,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
