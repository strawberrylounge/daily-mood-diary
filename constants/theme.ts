import { Platform } from "react-native";

export const Colors = {
  light: {
    primary: "#755E4A",
    primaryDark: "#5D4A3A",
    primaryLight: "#8F7260",

    secondary: "#C4A484",
    secondaryLight: "#D9C2A8",

    background: "#FAF7F4",
    surface: "#FFFFFF",

    text: "#2C231E",
    textSecondary: "#6B5D52",

    border: "#E0D3C5",

    success: "#7A9E7E",
    warning: "#D9A860",
    error: "#C07060",
  },
  dark: {
    // 다크모드 나중에 추가
    primary: "#8F7260",
    // ...
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
