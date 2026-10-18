"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrackerThemeToggle } from "./tracker-theme-toggle";

export function TrackerAdminNav() {
  const pathname = usePathname();
  const navLinkClass = "inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-[var(--lms-teal-deep)] hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]";
  return (
    <>
    <a href="#tracker-content"
      className="sr-only focus:not-sr-only focus:mb-2 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded focus:bg-surface focus:px-3 focus:font-semibold focus:text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
      Skip to content
    </a>
    <nav aria-label="42 Tracker" className="flex flex-wrap gap-2">
      <Link
        href="/tracker/issues"
        aria-current={pathname === "/tracker/issues" || pathname.startsWith("/tracker/issues/") ? "page" : undefined}
        className={navLinkClass}
      >
        Issues
      </Link>
      <Link
        href="/tracker"
        aria-current={pathname === "/tracker" ? "page" : undefined}
        className={navLinkClass}
      >
        Report Issue
      </Link>
      <Link
        href="/tracker/logs"
        aria-current={pathname === "/tracker/logs" ? "page" : undefined}
        title="Known Errors triage is migration-gated. Live Cloud Logging is still pending."
        className={navLinkClass}
      >
        Logs
      </Link>
      <Link
        href="/tracker/audit-findings"
        aria-current={pathname === "/tracker/audit-findings" || pathname.startsWith("/tracker/audit-findings/") ? "page" : undefined}
        className={navLinkClass}
      >
        Audit findings
      </Link>
      <TrackerThemeToggle />
    </nav>
    <span id="tracker-content" tabIndex={-1} className="sr-only">Tracker page content</span>
    </>
  );
}
