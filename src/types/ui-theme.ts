export interface UiThemeSpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl?: number;
}

export interface UiThemeConfig {
  colorPrimary: string;
  colorPrimaryHover: string;
  colorPrimaryBg: string;
  colorText: string;
  colorTextMuted: string;
  colorTextSubtle: string;
  colorBackground: string;
  colorBackgroundAlt: string;
  colorSurface: string;
  colorSurfaceElevated: string;
  colorBorder: string;
  colorBorderMuted: string;
  headerBg: string;
  borderRadius: number;
  fontSizeBase: number;
  lineHeightBase: number;
  fontFamily: string;
  controlHeight: number;
  cardShadow: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorInfo: string;
  spacingScale: UiThemeSpacingScale;
}
