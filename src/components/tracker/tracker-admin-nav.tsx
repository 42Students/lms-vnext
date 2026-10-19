"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrackerThemeToggle } from "./tracker-theme-toggle";

export function TrackerAdminNav() {
  const pathname = usePathname();
  const navLinkClass = "inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] font-semibold text-body hover:text-primary-text aria-[current=page]:border-primary aria-[current=page]:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]";
  return (
    <>
    <a href="#tracker-content"
      className="sr-only focus:not-sr-only focus:mb-2 focus:inline-flex focus:min-h-9 focus:items-center focus:rounded focus:bg-surface focus:px-3 focus:font-semibold focus:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
      Skip to content
    </a>
    <nav aria-label="42 Tracker" className="flex flex-wrap gap-3 border-b border-border">
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
