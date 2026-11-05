import { ButtonLink } from "@/components/ui/button-link";

/**
 * Downloads are regenerated at GET time from the current server-verified
 * Faculty teaching assignment, rather than trusting stale serialized scores.
 */
export function FacultyReportCsvDownload({
  href,notice,
}: {href:string;notice?:string}) {
  return <div className="flex flex-wrap items-center gap-3 print:hidden">
    <ButtonLink variant="secondary"
      href={href}
      aria-label="Download current faculty report as CSV"
    >
      Download CSV
    </ButtonLink>
    {notice?<p className="text-xs text-muted-foreground">{notice}</p>:null}
  </div>;
}
