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
      <span
        aria-disabled="true"
        title="Reporter intake is not enabled until the reporter-session migration is approved."
        className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-muted-foreground opacity-60"
      >
        Report issue · pending reporter auth
      </span>
      <span
        aria-disabled="true"
        title="Cloud log integration is a separate DB10 verification gate."
        className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-muted-foreground opacity-60"
      >
        Logs · pending
      </span>
    </nav>
  );
}
