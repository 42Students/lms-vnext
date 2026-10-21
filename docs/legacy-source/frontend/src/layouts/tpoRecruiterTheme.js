/**
 * tpoRecruiterTheme: the antd theme for the TPO and recruiter portals only (applied in layouts/layout.js for /tpo and /hr).
 * Why it exists: antd's defaults put white text on the brand teal (2.4:1), secondary text at 45% black (3.4:1)
 * and preset tag and link colours below 4.5:1. Fixing it as tokens fixes every button, tag, link, badge and
 * modal (portals included) in one place instead of hundreds of overrides. Neutrals mirror _tpo-tokens.scss.
 */
const INK = "#172033";      // $tpo-ink
const TEXT = "#334155";     // $tpo-text
const MUTED = "#5b6b82";    // $tpo-muted, 5.4:1 on white
const LINE = "#e7ecf2";     // $tpo-line
const LINE_STRONG = "#d6e1ee"; // $tpo-line-strong
const PRIMARY = "#0a7c88";  // white on it is 4.9:1 (brand teal #26bac7 is 2.4:1)

const tpoRecruiterTheme = {
  token: {
    colorPrimary: PRIMARY,
    colorInfo: PRIMARY,
    // Info messages (alerts, banners) get a light tint. Derived from the dark PRIMARY they came out a heavy grey-teal.
    colorInfoBg: "#f4fafb",
    colorInfoBorder: "#d6e9ec",
    colorLink: PRIMARY,
    colorLinkHover: "#086974",
    colorLinkActive: "#075963",
    colorError: "#cf1322",
    colorTextBase: INK,
    colorText: TEXT,
    colorTextSecondary: MUTED,
    colorTextTertiary: MUTED,
    colorTextDescription: MUTED,
    colorTextPlaceholder: "#66758d", // 4.6:1; antd's default is 25% black (1.7:1)
    colorBorder: LINE_STRONG,
    colorBorderSecondary: LINE,
    // Preset colours used by <Tag color="gold"> and friends: every one reads at 4.5:1 or better on its own tint.
    cyan: PRIMARY, gold: "#a05a00", orange: "#b34700", green: "#237804", blue: PRIMARY,
    purple: "#6b2fd1", red: "#cf1322", volcano: "#ad2102", magenta: "#b31a73", geekblue: "#1d39c4", lime: "#4d7c0f",
    // Structural tokens mirror the LMS-wide SCSS primitives: 6px controls, 12px cards,
    // 40px normal controls and 32px compact controls.
    borderRadius: 6,
    borderRadiusLG: 12,
    controlHeight: 40,
    controlHeightSM: 32,
    fontSize: 14,
    fontSizeSM: 13,
    wireframe: false,
  },
};

export const isTpoRecruiterPath = (pathname) => typeof pathname === "string" && /^\/(tpo|recruiter)(\/|$)/.test(pathname);

export default tpoRecruiterTheme;
