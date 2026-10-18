import Link from "next/link";

/** Report failures must never be rendered as zero outcomes or total counts. */
export function TpoReportInvalidFilters({path}:{path:string}){
 return <section role="alert" className="space-y-3 rounded-xl border border-border bg-surface p-6">
  <h1 className="font-semibold text-[30px] text-[#172033]">Invalid report filters</h1>
  <p className="text-sm text-body">No report records were loaded because the URL repeats a report filter. Choose one value per filter or clear the filters.</p>
  <Link href={path} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline">
   Clear filters
  </Link>
 </section>;
}
