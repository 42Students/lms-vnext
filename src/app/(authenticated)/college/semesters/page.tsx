import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAcademicDirectory } from "@/components/academics/college-academic-directory";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  academicDirectorySearchParams,
  collegeSemesterDirectorySchema,
} from "@/modules/academics/college-academic-directory-model";
import { listCollegeSemesters } from "@/modules/academics/college-academic-directory-service";
import { academicExportHref , ACADEMIC_EXPORT_CAP } from "@/modules/academics/college-academic-export-model";

export default async function CollegeSemestersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const params = academicDirectorySearchParams(await searchParams);
  const parsed = collegeSemesterDirectorySchema.safeParse(params);
  if (!parsed.success) {
    return <div className="space-y-4">
      <PageHeader eyebrow="College Admin · Academic Setup" title="Semesters" />
      <ErrorState title="Invalid semester filters"
        description={collegeDirectoryValidationMessage(parsed.error)}
        action={<Link href="/college/semesters" className="font-semibold text-primary-text">Clear filters</Link>} />
    </div>;
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
    <Link prefetch={false} download href={academicExportHref("SEMESTERS",parsed.data)}
      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Export CSV
    </Link>
    <p className="text-xs text-muted-foreground">Exports up to {ACADEMIC_EXPORT_CAP} matching semesters; the CSV records when results are truncated. Filters and college scope also apply to the download.</p>
    </div>
    <CollegeAcademicDirectory data={await listCollegeSemesters(context, parsed.data)} />
  </div>;
}
