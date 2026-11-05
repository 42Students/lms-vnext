import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
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
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";

export default async function CollegeClassesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 overflow-x-clip space-y-4">
    <PageHeader title="Classes & Sections" description="Create teaching sections within a batch, manage capacity and schedule recurring sessions from the same roster." />
    <div role="status" className="rounded-lg border border-[color:var(--lms-icon-amber)] bg-[color:var(--lms-gold-subtle)] p-4 text-sm">
      Admin not assigned to a college. Contact your administrator to be assigned to a college.{" "}
      <TextLink href="/dashboard">Choose a college workspace</TextLink>
    </div>
  </div>;
  const raw = readCollegeStructureParams(await searchParams);
  const parsed = collegeClassQuerySchema.safeParse(raw);
  if (!parsed.success) return <div className="min-w-0 overflow-x-clip space-y-4">
    <PageHeader title="Classes & Sections" />
    <ErrorState title="Invalid class filters"
      description={collegeDirectoryValidationMessage(parsed.error)}
      action={<TextLink href="/college/classes" className="inline-flex min-h-11 items-center md:min-h-9">Clear filters</TextLink>} />
  </div>;
  const [classes, optionResult, recurringResult] = await Promise.all([
    listCollegeClasses(context, parsed.data),
    listCollegeSectionOptions(context).then(options => ({ options, error: false as const }))
      .catch(() => ({ options: { cohorts: [], periods: [] }, error: true as const })),
    listRecurringPreviewOptions(context).catch(() => null),
  ]);
  const options = optionResult.options;
  return <CollegeStructureDirectory data={classes} {...(optionResult.error ? {} : { classOptions: options })} prepend={
    <div className="min-w-0 space-y-[var(--lms-space-3)]">
      {optionResult.error ? <div role="alert" className="flex flex-wrap items-center gap-2 border border-[color:var(--lms-icon-amber)] bg-[color:var(--lms-gold-subtle)] p-3 text-sm">Some setup options failed to load. <TextLink href="/college/classes">Retry options</TextLink></div> :
        <CollegeClassCreate cohorts={options.cohorts} periods={options.periods} />}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <ButtonLink variant="secondary" href="/college/classes">Refresh</ButtonLink>
        {recurringResult ? <CollegeRecurringEntry options={{...recurringResult,
          classes: recurringResult.classes.map(row => ({...row, updatedAt: row.updatedAt.toISOString()}))}} /> : null}
        <ButtonLink variant="secondary" href={classesExportHref(classes.query)} download="classes.csv">
          Export CSV
        </ButtonLink>
        <p className="text-xs text-muted-foreground">Export matches current filters and includes all pages.</p>
      </div>
      {/* Authorized class detail reads and mutations use distinct scoped endpoints;
          the legacy overloaded /getClass method is intentionally not exposed. */}
      <Disclosure title="More class tools" contentClassName="pt-[var(--lms-space-3)]">
        <div className="flex min-w-0 flex-col items-start gap-[var(--lms-space-3)] sm:flex-row sm:flex-wrap">
          <ButtonLink variant="secondary" href="/college/classes/recurring-preview"
            className="w-full sm:w-auto">
            Preview recurring class schedule
          </ButtonLink>
        </div>
        <p className="mt-[var(--lms-space-3)] max-w-[70ch] text-xs leading-5 text-muted-foreground">
          Export includes every class/section matching the current filters.
        </p>
      </Disclosure>
    </div>
  } />;
}
