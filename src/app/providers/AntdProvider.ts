import type { App } from 'vue';
import Antd from 'ant-design-vue';
import { uiThemeTokens } from '@/styles/theme-tokens';

export const appThemeConfig = {
  token: {
    colorPrimary: uiThemeTokens.colorPrimary,
    colorPrimaryBg: uiThemeTokens.colorPrimaryBg,
    colorLink: uiThemeTokens.colorPrimary,
    colorLinkHover: uiThemeTokens.colorPrimaryHover,
    colorTextBase: uiThemeTokens.colorText,
    colorText: uiThemeTokens.colorText,
    colorTextSecondary: uiThemeTokens.colorTextMuted,
    colorTextTertiary: uiThemeTokens.colorTextSubtle,
    colorBgBase: uiThemeTokens.colorBackground,
    colorBgLayout: uiThemeTokens.colorBackground,
    colorBgContainer: uiThemeTokens.colorSurface,
    colorBgElevated: uiThemeTokens.colorSurfaceElevated,
    colorBorder: uiThemeTokens.colorBorder,
    colorBorderSecondary: uiThemeTokens.colorBorderMuted,
    colorInfo: uiThemeTokens.colorInfo,
    colorSuccess: uiThemeTokens.colorSuccess,
    colorWarning: uiThemeTokens.colorWarning,
    colorError: uiThemeTokens.colorError,
    borderRadius: uiThemeTokens.borderRadius,
    borderRadiusLG: uiThemeTokens.borderRadius + 4,
    fontSize: uiThemeTokens.fontSizeBase,
    fontFamily: uiThemeTokens.fontFamily,
    lineHeight: uiThemeTokens.lineHeightBase,
    controlHeight: uiThemeTokens.controlHeight,
    controlHeightSM: uiThemeTokens.controlHeight - 6,
    controlHeightLG: uiThemeTokens.controlHeight + 8,
    boxShadow: uiThemeTokens.cardShadow,
    padding: uiThemeTokens.spacingScale.md,
    paddingSM: uiThemeTokens.spacingScale.sm,
    paddingLG: uiThemeTokens.spacingScale.lg
  },
  components: {
    Layout: {
      headerBg: uiThemeTokens.headerBg,
      bodyBg: uiThemeTokens.colorBackgroundAlt
    },
    Button: {
      colorPrimaryHover: uiThemeTokens.colorPrimaryHover,
      colorLink: uiThemeTokens.colorPrimary,
      colorLinkHover: uiThemeTokens.colorPrimaryHover,
      controlHeight: uiThemeTokens.controlHeight,
      borderRadius: uiThemeTokens.borderRadius
    },
    Card: {
      colorBgContainer: uiThemeTokens.colorSurface,
      boxShadow: uiThemeTokens.cardShadow,
      paddingLG: uiThemeTokens.spacingScale.lg,
      padding: uiThemeTokens.spacingScale.md
    },
    Tabs: {
      itemColor: uiThemeTokens.colorTextMuted,
      itemSelectedColor: uiThemeTokens.colorPrimary,
      inkBarColor: uiThemeTokens.colorPrimary
    },
    Form: {
      labelColor: uiThemeTokens.colorTextMuted,
      labelFontSize: uiThemeTokens.fontSizeBase,
      fontSize: uiThemeTokens.fontSizeBase,
      itemMarginBottom: uiThemeTokens.spacingScale.md
    },
    Input: {
      colorBgContainer: uiThemeTokens.colorSurfaceElevated,
      colorBorder: uiThemeTokens.colorBorder,
      colorTextPlaceholder: uiThemeTokens.colorTextMuted,
      controlHeight: uiThemeTokens.controlHeight
    },
    Result: {
      titleFontSize: uiThemeTokens.fontSizeBase * 1.25,
      subtitleColor: uiThemeTokens.colorTextMuted
    }
  }
};

export const setupAntdProvider = (app: App): void => {
  app.use(Antd);
};
