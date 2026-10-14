import Link from "next/link";

/**
 * Downloads are regenerated at GET time from the current server-verified
 * Faculty teaching assignment, rather than trusting stale serialized scores.
 */
export function FacultyReportCsvDownload({ href }: { href:string }) {
  return <div className="flex flex-wrap items-center gap-3 print:hidden">
    <Link
      href={href}
      className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:underline"
    >
      Download CSV
    </Link>
  </div>;
}
