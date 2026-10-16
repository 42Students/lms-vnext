import Link from "next/link";

export function TrackerAdminNav() {
  return (
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
        Known Errors · staged
      </Link>
    </nav>
  );
}
