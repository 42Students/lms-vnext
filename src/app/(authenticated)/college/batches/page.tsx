import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import Link from "next/link";
import {isSuperAdmin} from "@/modules/identity/context";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAcademicDirectory } from "@/components/academics/college-academic-directory";
import { CollegeCohortCreateForm } from "@/components/academics/college-cohort-management";
import { listAcademicPeriods } from "@/modules/academics/period-service";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  academicDirectorySearchParams,
  collegeBatchDirectorySchema,
} from "@/modules/academics/college-academic-directory-model";
import { listCollegeBatches } from "@/modules/academics/college-academic-directory-service";
import { academicExportHref, ACADEMIC_EXPORT_CAP } from "@/modules/academics/college-academic-export-model";

export default async function CollegeBatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title="Batches"/>
    <ErrorState title={isSuperAdmin(context)?"Select a college first":"Admin not assigned to a college"}
      description={isSuperAdmin(context)?
        "Select a college in the college and role switcher before viewing batches.":
        "Contact your administrator to assign a college before managing batches."}
      action={<Link href="/dashboard" className="font-semibold text-link underline">Back to dashboard</Link>}/>
  </section>;
  const params = academicDirectorySearchParams(await searchParams);
  const parsed = collegeBatchDirectorySchema.safeParse(params);
  if (!parsed.success) {
    return <div className="space-y-4">
      <PageHeader title="Batches" />
      <ErrorState title="Invalid batch filters"
        description={collegeDirectoryValidationMessage(parsed.error)}
        action={<Link href="/college/batches" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>} />
    </div>;
  }
  const [directoryResult, periodsResult] = await Promise.allSettled([
    listCollegeBatches(context, parsed.data),
    listAcademicPeriods(context, context.membership.collegeId),
  ]);
  if(directoryResult.status==="rejected")return <section className="min-w-0 space-y-4">
    <PageHeader title="Batches"/>
    <ErrorState title="Couldn't refresh batches" description="The batch directory is temporarily unavailable."
      action={<Link href="/college/batches" className="font-semibold text-link underline">Retry</Link>}/>
  </section>;
  const directory=directoryResult.value;
  const periods=periodsResult.status==="fulfilled"?periodsResult.value:[];
  const periodChoices = periods.filter(period => period.status !== "CLOSED").map(period => ({
    id: period.id, name: period.name, code: period.code,
  }));
  return <div className="min-w-0 space-y-[var(--lms-space-4)]"><CollegeAcademicDirectory data={directory} batchPeriods={periodChoices}
    actions={<Link prefetch={false} download href={academicExportHref("BATCHES",directory.query)}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] px-4 text-sm font-semibold text-[var(--lms-link-text)] md:min-h-9 md:w-auto hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      Export CSV
    </Link>}
    prepend={<>
      {periodsResult.status==="rejected"?<ErrorState title="Could not load academic periods"
        description="Some batch creation options are temporarily unavailable."
        action={<Link href="/college/batches" className="font-semibold text-link underline">Retry periods</Link>}/>:null}
      <CollegeCohortCreateForm programs={directory.programs.filter(p => p.status === "ACTIVE")} periods={periodChoices} />
    </>} />
    <p className="text-xs text-muted-foreground">The legacy program-scoped batch search requires a programId;
      select a specific program for equivalent scoped results. The college directory also supports an all-program view.</p>
    <p className="max-w-[80ch] text-xs leading-5 text-muted-foreground">Exports up to {ACADEMIC_EXPORT_CAP} matching batches; the CSV records when results are truncated. Filters and college scope also apply to the download.</p>
  </div>;
}
