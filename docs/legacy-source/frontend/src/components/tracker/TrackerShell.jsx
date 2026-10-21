import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfigProvider, theme as antdTheme } from "antd";
import { BulbFilled, BulbOutlined } from "@ant-design/icons";
import { QUICK_REPORT_ENABLED_KEY } from "@/utils/bugTrackerQuickReport";
import { applyTrackerTheme, getInitialTrackerTheme } from "@/utils/bugTrackerTheme";

export default function TrackerShell({ children, active = "report" }) {
  const [showLogs, setShowLogs] = useState(active === "logs" || active === "findings");
  // null (not a real theme) until the post-mount localStorage/OS-preference check runs, same
  // reasoning as isManager elsewhere in tracker: resolving this synchronously during SSR isn't
  // possible without risking a server/client markup mismatch.
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(QUICK_REPORT_ENABLED_KEY, "true");
      const userData = JSON.parse(localStorage.getItem("userData") || "null");
      setShowLogs(active === "logs" || active === "findings" || userData?.id === 0);
    } catch (_) {
      setShowLogs(active === "logs");
    }
    document.documentElement.classList.add("tracker-scroll-active");
    document.body.classList.add("tracker-scroll-active");
    return () => {
      document.documentElement.classList.remove("tracker-scroll-active");
      document.body.classList.remove("tracker-scroll-active");
    };
  }, []);

  useEffect(() => {
    const initial = getInitialTrackerTheme();
    setTheme(initial);
    applyTrackerTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTrackerTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { colorPrimary: "#26bac7", borderRadius: 10 },
      }}
    >
      <main className="tracker-page">
        <a href="#tracker-main-content" className="tracker-skip-link">Skip to content</a>

        <header className="tracker-header">
          <Link href="/tracker" className="tracker-brand" aria-label="42 Tracker home">
            <span className="tracker-brand-mark">42</span>
            <span>
              <strong>Tracker</strong>
              <small>LMS issue reporting</small>
            </span>
          </Link>

          <nav className="tracker-nav" aria-label="Tracker">
            <Link href="/tracker" className={active === "report" ? "is-active" : ""}>Report Issue</Link>
            <Link href="/tracker/issues" className={active === "issues" ? "is-active" : ""}>Issues</Link>
            {showLogs && <Link href="/tracker/logs" className={active === "logs" ? "is-active" : ""}>Logs</Link>}
            {showLogs && <Link href="/tracker/audit-findings" className={active === "findings" ? "is-active" : ""}>Audit findings</Link>}
          </nav>

          <div className="tracker-header-end">
            {theme !== null && (
              <button
                type="button"
                className="tracker-theme-toggle"
                onClick={toggleTheme}
                aria-pressed={isDark}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <BulbFilled /> : <BulbOutlined />}
                <span>{isDark ? "Dark" : "Light"}</span>
              </button>
            )}
          </div>
        </header>

        <div className="tracker-content" id="tracker-main-content" tabIndex={-1}>{children}</div>
      </main>
    </ConfigProvider>
  );
}
