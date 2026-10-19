import Link from "next/link";

/**
 * Downloads are regenerated at GET time from the current server-verified
 * Faculty teaching assignment, rather than trusting stale serialized scores.
 */
export function FacultyReportCsvDownload({
  href,notice,
}: {href:string;notice?:string}) {
  return <div className="flex flex-wrap items-center gap-3 print:hidden">
    <Link
      href={href}
      aria-label="Download current faculty report as CSV"
      className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
    >
      Download CSV
    </Link>
    {notice?<p className="text-xs text-muted-foreground">{notice}</p>:null}
  </div>;
}
