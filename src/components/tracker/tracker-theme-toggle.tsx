"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const STORAGE_KEY = "42tracker_theme_v1";
type TrackerTheme = "light" | "dark";

function applyTrackerTheme(theme: TrackerTheme) {
  document.documentElement.setAttribute("data-tracker-theme", theme);
}

export function TrackerThemeToggle() {
  const [theme, setTheme] = useState<TrackerTheme>("light");

  useEffect(() => {
    // Restore preference after mount, without touching the server-rendered DOM.
    const frame = window.requestAnimationFrame(() => {
      let saved: TrackerTheme = "light";
      try {
        if (window.localStorage.getItem(STORAGE_KEY) === "dark") saved = "dark";
      } catch {
        // Private browsing may disable storage; the toggle remains usable.
      }
      setTheme(saved);
      applyTrackerTheme(saved);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      // The LMS default remains light when leaving the tracker workspace.
      document.documentElement.removeAttribute("data-tracker-theme");
    };
  }, []);

  function toggleTheme() {
    const next: TrackerTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTrackerTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persisting the preference is optional; changing the theme still works.
    }
  }

  return (
    <Button variant="secondary"
      type="button"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={theme === "dark"}
      onClick={toggleTheme}
      className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </Button>
  );
}
