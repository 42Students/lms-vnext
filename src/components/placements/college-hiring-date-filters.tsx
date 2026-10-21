"use client";

import Link from "next/link";
import { collegeHiringAnalyticsHref } from "@/modules/placements/college-hiring-analytics-model";
import {Input} from "@/components/ui/input";

type FilterKey = "seasonId" | "jobId" | "departmentId" | "programId" | "cohortId" | "from" | "to";
type Filters = Partial<Record<FilterKey, string>>;

/** Both limits are independent: clearing either endpoint leaves the other
 * active. Native change events immediately reload the scoped report. */
export function CollegeHiringDateFilters({ filters }: { filters: Filters }) {
  const base = { ...filters, from: undefined, to: undefined };
  return <form method="get" action="/college/hiring-dashboard"
    aria-label="Hiring date range" className="flex flex-wrap items-end gap-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 print:hidden">
    {(["seasonId", "jobId", "departmentId", "programId", "cohortId"] as const)
      .filter(key => Boolean(filters[key]))
      .map(key => <input key={key} type="hidden" name={key} value={filters[key]} />)}
    {(["from", "to"] as const).map(key =>
      <label key={key} className="grid min-w-0 gap-1 text-sm font-semibold text-body">
        {key === "from" ? "From date" : "To date"}
        <Input name={key} type="date" defaultValue={filters[key] ?? ""}
          aria-label={key === "from" ? "From date (optional)" : "To date (optional)"}
          onChange={event => event.currentTarget.form?.requestSubmit()}
          />
      </label>)}
    <Link href={collegeHiringAnalyticsHref(base)}
      className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
      Clear dates
    </Link>
    <button type="submit" className="sr-only">Apply dates</button>
  </form>;
}
