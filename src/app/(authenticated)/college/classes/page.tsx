import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeStructureDirectory } from "@/components/academics/college-structure-directory";
import { CollegeClassCreate } from "@/components/academics/college-section-management";
import { CollegeRecurringEntry } from "@/components/academics/college-recurring-entry";
import { Disclosure } from "@/components/ui/disclosure";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  collegeClassQuerySchema,
  readCollegeStructureParams,
} from "@/modules/academics/college-structure-directory-model";
import { listCollegeClasses } from "@/modules/academics/college-structure-directory-service";
import { classesExportHref } from "@/modules/academics/college-classes-export-model";
import { listCollegeSectionOptions } from "@/modules/academics/college-section-mutation-service";
import { listRecurringPreviewOptions } from "@/modules/academics/college-recurring-preview-service";

export default async function CollegeClassesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="space-y-4">
    <PageHeader title="Classes & Sections" description="Create teaching sections within a batch, manage capacity and schedule recurring sessions from the same roster." />
    <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
      Admin not assigned to a college. Contact your administrator to be assigned to a college.{" "}
      <Link href="/dashboard" className="font-semibold text-primary-text underline">Choose a college workspace</Link>
    </div>
  </div>;
  const raw = readCollegeStructureParams(await searchParams);
  const parsed = collegeClassQuerySchema.safeParse(raw);
  if (!parsed.success) return <div className="space-y-4">
    <PageHeader title="Classes & Sections" />
    <ErrorState title="Invalid class filters"
      description={collegeDirectoryValidationMessage(parsed.error)}
      action={<Link href="/college/classes" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>} />
  </div>;
  const [classes, optionResult, recurringResult] = await Promise.all([
    listCollegeClasses(context, parsed.data),
    listCollegeSectionOptions(context).then(options => ({ options, error: false as const }))
      .catch(() => ({ options: { cohorts: [], periods: [] }, error: true as const })),
    listRecurringPreviewOptions(context).catch(() => null),
  ]);
  const options = optionResult.options;
  return <CollegeStructureDirectory data={classes} classOptions={optionResult.error ? undefined : options} prepend={
    <div className="min-w-0 space-y-[var(--lms-space-3)]">
      {optionResult.error ? <div role="alert" className="flex flex-wrap items-center gap-2 border border-amber-300 bg-amber-50 p-3 text-sm">Some setup options failed to load. <Link href="/college/classes" className="font-semibold underline">Retry options</Link></div> :
        <CollegeClassCreate cohorts={options.cohorts} periods={options.periods} />}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Link href="/college/classes" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-[var(--lms-primary)] md:min-h-9">Refresh</Link>
        {recurringResult ? <CollegeRecurringEntry options={{...recurringResult,
          classes: recurringResult.classes.map(row => ({...row, updatedAt: row.updatedAt.toISOString()}))}} /> : null}
        <a href={classesExportHref(classes.query)} download="classes.csv"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-semibold text-link hover:border-[var(--lms-primary)] md:min-h-9">
          Export CSV
        </a>
        <p className="text-xs text-muted-foreground">Export matches current filters and includes all pages.</p>
      </div>
      {/* Authorized class detail reads and mutations use distinct scoped endpoints;
          the legacy overloaded /getClass method is intentionally not exposed. */}
      <Disclosure title="More class tools" contentClassName="pt-[var(--lms-space-3)]">
        <div className="flex min-w-0 flex-col items-start gap-[var(--lms-space-3)] sm:flex-row sm:flex-wrap">
          <Link href="/college/classes/recurring-preview"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-4)] text-sm font-[650] text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">
            Preview recurring class schedule
          </Link>
        </div>
        <p className="mt-[var(--lms-space-3)] max-w-[70ch] text-xs leading-5 text-muted-foreground">
          Export includes every class/section matching the current filters.
        </p>
      </Disclosure>
    </div>
  } />;
}
