/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        blue: {
          50: "#EEF4FF",
          100: "#DCE8FF",
          200: "#B6CFFF",
          300: "#7FA8FF",
          400: "#4F87FE",
          500: "#2D6FF5",
          600: "#1F5BDB",
          700: "#1A4AB3",
          900: "#0F2A6B",
        },
        ink: {
          50: "#F8FAFC",
          100: "#F1F3F7",
          200: "#E3E6EC",
          300: "#C2C7D1",
          400: "#9097A4",
          500: "#6B7383",
          600: "#4B5567",
          700: "#2C3547",
          800: "#1A2233",
          900: "#0B1220",
        },
        chip: "#EAF1FE",
        success: "#10B981",
        warn: "#F59E0B",
        danger: "#EF4444",
        primary: "#2D6FF5",
        accent: "#10B981",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "22px",
        pill: "9999px",
      },
      fontFamily: {
        sans: ["Pretendard", "System"],
        serif: ["SourceSerif4", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
