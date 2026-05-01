// VocaNova Design Tokens
// 디자인 핸드오프(design_handoff_vocanova/tokens.js)에서 포팅 — 값 1:1 보존

export const colors = {
  blue: {
    50: "#EEF4FF",
    100: "#DCE8FF",
    200: "#B6CFFF",
    300: "#7FA8FF",
    400: "#4F87FE",
    500: "#2D6FF5", // primary
    600: "#1F5BDB",
    700: "#1A4AB3",
    900: "#0F2A6B",
  },
  ink: {
    900: "#0B1220",
    800: "#1A2233",
    700: "#2C3547",
    600: "#4B5567",
    500: "#6B7383",
    400: "#9097A4",
    300: "#C2C7D1",
    200: "#E3E6EC",
    100: "#F1F3F7",
    50: "#F8FAFC",
  },
  success: "#10B981",
  warn: "#F59E0B",
  danger: "#EF4444",
  chip: "#EAF1FE",
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

// React Native shadow + elevation 매핑
export const shadow = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  pop: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  primary: {
    shadowColor: "#2D6FF5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  "2xl": 14,
  "3xl": 16,
  "4xl": 20,
  "5xl": 22,
} as const;

// 타이포그래피 스케일 (README 기준)
export const typography = {
  // 본문/UI는 Pretendard, fallback: system
  // 단어/IPA는 Source Serif 4
  fonts: {
    sans: undefined as string | undefined, // Pretendard 등록 시 'Pretendard'로
    serif: undefined as string | undefined, // 'SourceSerif4'로 등록 시
    mono: undefined as string | undefined,
  },
  // 사이즈/굵기 프리셋
  label: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.2 },
  caption: { fontSize: 12, fontWeight: "500" as const },
  body: { fontSize: 14, fontWeight: "500" as const },
  bodyStrong: { fontSize: 14, fontWeight: "700" as const },
  cardTitle: { fontSize: 18, fontWeight: "700" as const, letterSpacing: -0.4 },
  pageTitle: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.4 },
  hero: { fontSize: 38, fontWeight: "800" as const, letterSpacing: -1.2 },
} as const;

export const tokens = {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} as const;

export type Tokens = typeof tokens;
