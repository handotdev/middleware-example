import { fontFamily as _fontFamily } from "tailwindcss/defaultTheme";

export const presets = [require("@vercel/examples-ui/tailwind")];
export const content = [
  "./pages/**/*.{js,ts,jsx,tsx}",
  "./components/**/*.{js,ts,jsx,tsx}",
  "./node_modules/@vercel/examples-ui/**/*.js",
];
export const theme = {
  extend: {
    fontFamily: {
      sans: ["Inter", ..._fontFamily.sans],
      serif: ["Inter", ..._fontFamily.serif],
      mono: [..._fontFamily.mono],
    },

    boxShadow: {
      button: "0px 2px 4px rgba(0, 0, 0, 0.05)" /* Button Drop Shadow */,
      active: "0px 0px 0px 2px #C4D8FD" /* Active Drop Shadow */,
      "active-input":
        "0px 0px 0px 2px #C4D8FD, inset 0px 0px 8px rgba(0, 0, 0, 0.04)" /* Active Input Field */,
      card: "0px 2px 4px rgba(0, 0, 0, 0.08)" /* Card Drop Shadow */,
      "active-danger":
        "0px 0px 0px 2px #FCA5A5" /* Active Error Drop Shadow: missing in figma */,
      box: "0px 2px 10px rgba(0, 0, 0, 0.15)" /* Box Drop Shadow */ /* Drop Shadow Container */,
      inner:
        "inset 0px 0px 8px rgba(0, 0, 0, 0.04)" /* Inner Shadow (used only for inputs and textareas) */,
    },

    borderRadius: {
      "4xl": "36px",
    },

    dropShadow: {
      button: "0px 2px 4px rgba(0, 0, 0, 0.05)",
    },
    fontSize: {
      h700: ["2.5rem", "120%"] /* 40px, 44px */,
      h600: ["1.875rem", "180%"] /* 30px, 54px */,
      h500: ["1.375rem", "165%"] /* 22px, 36px */,
      h400: ["1.125rem", "155%"] /* 18px, 28px */,
      h300: ["1rem", "150%"] /* 16px, 24px */,
      h200: ["0.875rem", "145%"] /* 14px 20px */,
      h100: ["0.75rem", "100%"] /* 12px, 16px */,
    },
  },
};
