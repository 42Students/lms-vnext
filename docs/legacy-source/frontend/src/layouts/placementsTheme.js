/**
 * placementsTheme — AntD ConfigProvider theme scoped to the student placements
 * module only (applied in PlacementsTabsLayout). Deliberately NOT app-wide:
 * placements should read as elevated relative to the rest of the product, and
 * scoping avoids regressing admin / courses / projects.
 *
 * Values mirror the SCSS tokens in src/styles/components/_variables.scss.
 */

// Mirrors of _variables.scss tokens
const TEAL_DEEP = "#0E7C87"; // $teal-deep
const SUCCESS = "#059669"; // $status-success
const WARNING = "#d97706"; // $status-warning
const ERROR = "#b42318"; // restrained red
const NEUTRAL_900 = "#1a1d21"; // $neutral-900
const NEUTRAL_700 = "#54505d"; // $neutral-700
const NEUTRAL_500 = "#6b7280"; // $neutral-500
const NEUTRAL_200 = "#e5e9f0"; // $neutral-200
const NEUTRAL_100 = "#f1f4f9"; // $neutral-100
const NEUTRAL_50 = "#fafbfc"; // $neutral-50

// $elev-3
const ELEV_3 =
  "0 4px 8px rgba(16, 24, 40, 0.04), 0 12px 24px rgba(16, 24, 40, 0.08)";
// $elev-2
const ELEV_2 =
  "0 2px 4px rgba(16, 24, 40, 0.04), 0 4px 12px rgba(16, 24, 40, 0.06)";

const FONT_FAMILY =
  '"Lato-Regular", Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const placementsTheme = {
  token: {
    colorPrimary: TEAL_DEEP,
    colorInfo: TEAL_DEEP,
    colorSuccess: SUCCESS,
    colorWarning: WARNING,
    colorError: ERROR,

    colorTextBase: NEUTRAL_900,
    colorTextSecondary: NEUTRAL_700,
    colorTextTertiary: NEUTRAL_500,
    colorBorder: NEUTRAL_200,
    colorBorderSecondary: NEUTRAL_100,
    colorBgLayout: NEUTRAL_100,

    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,

    fontFamily: FONT_FAMILY,
    fontSize: 14,

    controlHeight: 38,
    controlHeightSM: 30,
    controlHeightLG: 44,

    boxShadowSecondary: ELEV_3,
    boxShadowTertiary: ELEV_2,

    lineWidth: 1,
    wireframe: false,
  },

  components: {
    Modal: {
      borderRadiusLG: 16,
      headerBg: "transparent",
      titleFontSize: 18,
      titleColor: NEUTRAL_900,
      contentBg: "#ffffff",
      paddingContentHorizontalLG: 24,
      boxShadow: ELEV_3,
    },
    Tabs: {
      inkBarColor: TEAL_DEEP,
      itemColor: NEUTRAL_500,
      itemHoverColor: TEAL_DEEP,
      itemSelectedColor: TEAL_DEEP,
      titleFontSize: 14,
      horizontalItemGutter: 24,
    },
    Tag: {
      borderRadiusSM: 6,
      defaultBg: NEUTRAL_100,
      defaultColor: NEUTRAL_700,
      fontSizeSM: 12,
      lineHeightSM: 1.4,
    },
    Select: {
      borderRadius: 10,
      controlHeight: 38,
      optionSelectedBg: "rgba(14, 124, 135, 0.08)",
      optionSelectedColor: TEAL_DEEP,
      optionActiveBg: NEUTRAL_100,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 38,
      activeShadow: "0 0 0 3px rgba(14, 124, 135, 0.10)",
      hoverBorderColor: "rgba(14, 124, 135, 0.45)",
      activeBorderColor: TEAL_DEEP,
    },
    Button: {
      fontWeight: 600,
      borderRadius: 10,
      controlHeight: 38,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
    },
    Descriptions: {
      labelBg: NEUTRAL_50,
      colorSplit: NEUTRAL_200,
      titleColor: NEUTRAL_900,
      contentColor: NEUTRAL_900,
      labelColor: NEUTRAL_500,
      borderRadiusLG: 12,
      padding: 16,
    },
    Timeline: {
      dotBg: "#ffffff",
      tailColor: NEUTRAL_200,
      tailWidth: 1,
      itemPaddingBottom: 18,
    },
    Segmented: {
      borderRadius: 10,
      itemSelectedBg: "#ffffff",
      itemSelectedColor: TEAL_DEEP,
      itemHoverBg: NEUTRAL_50,
      trackBg: NEUTRAL_100,
      trackPadding: 3,
    },
    Skeleton: {
      borderRadiusSM: 6,
      gradientFromColor: NEUTRAL_100,
      gradientToColor: NEUTRAL_50,
    },
    Empty: {
      colorTextDescription: NEUTRAL_500,
    },
  },
};

export default placementsTheme;
