import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";

/** Report failures must never be rendered as zero outcomes or total counts. */
export function TpoReportInvalidFilters({path}:{path:string}){
 return <section role="alert" className="space-y-3 border-b border-border pb-6">
  <PageHeader title="Invalid report filters" />
  <p className="text-sm text-body">No report records were loaded because the URL repeats a report filter. Choose one value per filter or clear the filters.</p>
  <Link href={path} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
   Clear filters
  </Link>
 </section>;
}
