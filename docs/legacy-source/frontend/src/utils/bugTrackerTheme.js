export const TRACKER_THEME_KEY = "42tracker_theme_v1";

export function getInitialTrackerTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(TRACKER_THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch (_) {
    // localStorage can throw in a locked-down browser context; fall through to the OS preference.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Applied to <html>, not .tracker-page, because antd portals a Drawer's and a Popover's content
// out to (usually) document.body -- html is the one ancestor guaranteed to contain a portaled
// node no matter where its target container lives. Harmless to leave in place once the reporter
// navigates away from /tracker: nothing outside these pages reads this attribute.
export function applyTrackerTheme(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-tracker-theme", theme);
  try {
    localStorage.setItem(TRACKER_THEME_KEY, theme);
  } catch (_) {
    // Best-effort persistence only.
  }
}
