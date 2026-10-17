import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import { academicExportHref , ACADEMIC_EXPORT_CAP } from "@/modules/academics/college-academic-export-model";

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
      <PageHeader eyebrow="College Admin · Academic Setup" title="Batches" />
      <ErrorState title="Invalid batch filters"
        description={collegeDirectoryValidationMessage(parsed.error)}
        action={<Link href="/college/batches" className="font-semibold text-primary-text">Clear filters</Link>} />
    </div>;
  }
  const [directory, periods] = await Promise.all([
    listCollegeBatches(context, parsed.data),
    listAcademicPeriods(context, context.membership.collegeId),
  ]);
  const periodChoices = periods.filter(period => period.status !== "CLOSED").map(period => ({
    id: period.id, name: period.name, code: period.code,
  }));
  return <div className="min-w-0 space-y-6">
    <CollegeCohortCreateForm programs={directory.programs.filter(p => p.status === "ACTIVE")} periods={periodChoices} />
    <div className="flex flex-wrap items-center gap-3">
    <Link prefetch={false} download href={academicExportHref("BATCHES",directory.query)}
      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Export CSV
    </Link>
    <p className="text-xs text-muted-foreground">Exports up to {ACADEMIC_EXPORT_CAP} matching batches; the CSV records when results are truncated. Filters and college scope also apply to the download.</p>
    </div>
    <CollegeAcademicDirectory data={directory} batchPeriods={periodChoices} />
  </div>;
}
