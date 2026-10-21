import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import Link from "next/link";
import { Banner } from "@/components/ui/banner";
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
  if (!context.membership) return <div className="min-w-0 space-y-4">
    <PageHeader title="Semesters" />
    <Banner tone="warning"><strong>Admin not assigned to a college</strong>
      <p>You must be assigned to a college to view and manage semesters. Contact your administrator.</p>
    </Banner>
  </div>;
  const params = academicDirectorySearchParams(await searchParams);
  const parsed = collegeSemesterDirectorySchema.safeParse(params);
  if (!parsed.success) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Semesters" />
      <ErrorState title="Invalid semester filters"
        description={collegeDirectoryValidationMessage(parsed.error)}
        action={<Link href="/college/semesters" className="lms-inline-link inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline min-[768px]:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>} />
    </div>;
  }
  return <div className="min-w-0 space-y-4">
    <CollegeAcademicDirectory
      data={await listCollegeSemesters(context, parsed.data)}
      actions={<Link prefetch={false} download href={academicExportHref("SEMESTERS",parsed.data)}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-4 text-[14px] font-[650] text-[var(--lms-link-text)] min-[768px]:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Export CSV
      </Link>}
    />
    <p className="text-xs text-muted-foreground">Exports up to {ACADEMIC_EXPORT_CAP} matching semesters; the CSV records when results are truncated. Filters and college scope also apply to the download.</p>
  </div>;
}
