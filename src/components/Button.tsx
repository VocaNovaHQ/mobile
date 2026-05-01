import { useState } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import { Icon, type IconName } from "./Icon";
import { colors, shadow } from "../theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const SIZE_TOKENS = {
  sm: { h: 36, px: 14, fs: 13, gap: 6, r: 10 },
  md: { h: 46, px: 18, fs: 14, gap: 8, r: 12 },
  lg: { h: 56, px: 22, fs: 16, gap: 10, r: 14 },
} as const;

type Palette = {
  bg: string;
  fg: string;
  border?: string;
  shadow?: ViewStyle;
};

export type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  onPress?: () => void;
  full?: boolean;
  dark?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

function getPalette(variant: ButtonVariant, dark: boolean): Palette {
  switch (variant) {
    case "primary":
      return { bg: colors.blue[500], fg: "#fff", shadow: shadow.primary };
    case "secondary":
      return {
        bg: dark ? "rgba(255,255,255,0.08)" : colors.ink[100],
        fg: dark ? "#fff" : colors.ink[900],
      };
    case "ghost":
      return { bg: "transparent", fg: dark ? "#fff" : colors.ink[900] };
    case "outline":
      return {
        bg: "transparent",
        fg: colors.blue[500],
        border: colors.blue[500],
      };
    case "danger":
      return { bg: colors.danger, fg: "#fff" };
  }
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  onPress,
  full,
  dark = false,
  disabled,
  style,
}: ButtonProps) {
  const s = SIZE_TOKENS[size];
  const palette = getPalette(variant, dark);
  const [pressed, setPressed] = useState(false);

  const baseStyle: ViewStyle = {
    height: s.h,
    paddingHorizontal: s.px,
    borderRadius: s.r,
    backgroundColor: palette.bg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: full ? "100%" : undefined,
    opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
  };

  if (palette.border) {
    baseStyle.borderWidth = 1.5;
    baseStyle.borderColor = palette.border;
  }

  const styles: ViewStyle[] = [baseStyle];
  if (palette.shadow) styles.push(palette.shadow);
  if (style) styles.push(style);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      style={styles}
    >
      {icon ? (
        <>
          <Icon
            name={icon}
            size={s.fs + 4}
            color={palette.fg}
            strokeWidth={2}
          />
          <View style={{ width: s.gap }} />
        </>
      ) : null}
      <Text
        style={{
          fontSize: s.fs,
          fontWeight: "700",
          letterSpacing: -0.1,
          color: palette.fg,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
