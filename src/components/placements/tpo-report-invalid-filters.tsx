import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";

/** Report failures must never be rendered as zero outcomes or total counts. */
export function TpoReportInvalidFilters({path}:{path:string}){
 return <section className="space-y-3 border-b border-border pb-6">
  <PageHeader title="Invalid report filters" />
  <Alert tone="error">No report records were loaded because the URL repeats a report filter. Choose one value per filter or clear the filters.</Alert>
  <Link href={path} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
   Clear filters
  </Link>
 </section>;
}
