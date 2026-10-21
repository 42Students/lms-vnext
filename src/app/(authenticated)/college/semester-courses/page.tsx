import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { Alert } from "@/components/ui/alert";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { CollegeTermMappingManager } from "@/components/academics/college-term-mapping-manager";
import { listCollegeTermMappings } from "@/modules/academics/college-term-mapping-service";

export default async function CollegeSemesterCoursesPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-6">
    <PageHeader title="Semester–Course Mapping"
      description="Define the curriculum for each semester and spot courses that still need faculty coverage." />
    <ErrorState title="Admin not assigned to a college"
      description="Your account has no current college assignment. Contact your administrator to restore access to semester–course mappings." />
  </div>;
  const curriculumData = await listCollegeTermMappings(context).catch((error:unknown) => {
    if (error instanceof AuthorizationError) throw error;
    return null;
  });
  return <div className="min-w-0 space-y-6 md:space-y-6">
    <PageHeader title="Semester–Course Mapping"
      description="Define the curriculum for each semester and spot courses that still need faculty coverage."
      actions={<Link href="/college/courses"
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-semibold text-[var(--lms-primary-text)] transition-[background-color,border-color] duration-[150ms] md:min-h-9 motion-reduce:transition-none hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Course offerings
      </Link>} />
    <nav aria-label="Academic setup" className="flex min-w-0 flex-wrap items-center gap-4 border-b border-[var(--lms-canvas-border)] pb-3 text-sm">
      <Link href="/college/academics" className="font-semibold text-primary-text hover:underline">Academic workspace</Link>
      <Link href="/college/programs" className="font-semibold text-primary-text hover:underline">Programs</Link>
      <span aria-current="page" className="border-b-2 border-[var(--lms-primary)] pb-1 font-semibold text-foreground">Semester–Course Mapping</span>
    </nav>
    {!curriculumData ? <ErrorState title="Semester–course mappings could not be loaded"
      description="The college curriculum could not be refreshed. No mappings were changed."
      action={<a href="/college/semester-courses" className="font-semibold text-link underline underline-offset-4">Retry curriculum</a>}/> :
      <>
        {curriculumData.lookupFailures.length ? <Alert tone="warning" title="Curriculum lookup incomplete">
          Failed to refresh: {curriculumData.lookupFailures.join(", ")}.
          {" "}<a href="/college/semester-courses" className="font-semibold underline underline-offset-4">Retry curriculum lookups</a>.
          The mapping editor is paused until all three same-college reads are available.
        </Alert> : null}
        {!curriculumData.staffingAvailable ? <Alert tone="warning" title="Faculty staffing warnings unavailable">
          The semester mappings are still available, but current active-delivery staffing could not be checked.
          {" "}<a href="/college/semester-courses" className="font-semibold underline underline-offset-4">Retry staffing read</a>.
        </Alert> : null}
        {curriculumData.lookupFailures.length===0 ?
          <CollegeTermMappingManager key={context.membership.collegeId} data={curriculumData} /> : null}
      </>}
  </div>;
}
