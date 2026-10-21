import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAcademicDirectory } from "@/components/academics/college-academic-directory";
import { CollegeCohortCreateForm } from "@/components/academics/college-cohort-management";
import { listAcademicPeriods } from "@/modules/academics/period-service";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { Banner } from "@/components/ui/banner";
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
  if (!context.membership) redirect("/dashboard");
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
  const [directoryRead,periodRead]=await Promise.allSettled([
    listCollegeBatches(context,parsed.data),listAcademicPeriods(context,context.membership.collegeId),
  ]);
  if(directoryRead.status==="rejected")return <section className="min-w-0 space-y-4">
    <PageHeader title="Batches"/>
    <Banner tone="error">Couldn't refresh batches. Previous results have not been replaced with an empty list.</Banner>
    <ErrorState title="Could not load batches" description="The college batch directory is temporarily unavailable."
      action={<Link href="/college/batches" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry batches</Link>}/>
  </section>;
  const directory=directoryRead.value;
  const periods=periodRead.status==="fulfilled"?periodRead.value:[];
  const periodChoices = periods.filter(period => period.status !== "CLOSED").map(period => ({
    id: period.id, name: period.name, code: period.code,
  }));
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <Tabs ariaLabel="Academic Setup" renderPanel={false} value="/college/batches"
      items={[
       {value:"/college/academics",label:"Academic Setup",href:"/college/academics"},
       {value:"/college/programs",label:"Programs",href:"/college/programs"},
       {value:"/college/batches",label:"Batches",href:"/college/batches"},
       {value:"/college/semesters",label:"Semesters",href:"/college/semesters"},
       {value:"/college/electives",label:"Electives",href:"/college/electives"},
      ]}/>
    {periodRead.status==="rejected"?<Banner tone="warning">
      Academic periods could not be loaded. Batch creation requiring a period is unavailable.
      <Link href="/college/batches" className="ml-2 font-semibold text-link underline">Retry periods</Link>
    </Banner>:null}
    <CollegeAcademicDirectory data={directory} batchPeriods={periodChoices}
    actions={<Link prefetch={false} download href={academicExportHref("BATCHES",directory.query)}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] px-4 text-sm font-semibold text-[var(--lms-link-text)] md:min-h-9 md:w-auto hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      Export CSV
    </Link>}
    prepend={<CollegeCohortCreateForm programs={directory.programs.filter(p => p.status === "ACTIVE")} periods={periodChoices} />} />
    <p className="max-w-[80ch] text-xs leading-5 text-muted-foreground">Export includes matching records beyond the current 10-row screen, not only visible rows. Exports up to {ACADEMIC_EXPORT_CAP} matching batches; the CSV records when results are truncated. Filters and college scope also apply to the download.</p>
  </div>;
}
