import Link from "next/link";
import { TrackerThemeToggle } from "./tracker-theme-toggle";

export function TrackerAdminNav() {
  return (
    <>
    <a href="#tracker-content"
      className="sr-only focus:not-sr-only focus:mb-2 focus:inline-flex focus:min-h-10 focus:items-center focus:rounded focus:bg-surface focus:px-3 focus:font-semibold focus:text-primary-text focus:ring-2 focus:ring-primary">
      Skip to content
    </a>
    <nav aria-label="42 Tracker" className="flex flex-wrap gap-2">
      <Link
        href="/tracker/issues"
        className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle"
      >
        Issues
      </Link>
      <Link
        href="/tracker"
        className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle"
      >
        Report issue
      </Link>
      <Link
        href="/tracker/logs"
        title="Known Errors triage is migration-gated. Live Cloud Logging is still pending."
        className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle"
      >
        Logs
      </Link>
      <Link
        href="/tracker/audit-findings"
        className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle"
      >
        Audit findings
      </Link>
      <TrackerThemeToggle />
    </nav>
    <span id="tracker-content" tabIndex={-1} className="sr-only">Tracker page content</span>
    </>
  );
}
