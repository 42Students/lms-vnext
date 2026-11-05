import { ErrorState } from "@/components/ui/error-state";
import { Alert } from "@/components/ui/alert";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { CollegeTermMappingRetained } from "@/components/academics/college-term-mapping-retained";
import { listCollegeTermMappings } from "@/modules/academics/college-term-mapping-service";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

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
      actions={<ButtonLink variant="secondary" href="/college/courses">
        Course offerings
      </ButtonLink>} />
    <nav aria-label="Academic setup" className="flex min-w-0 flex-wrap items-center gap-4 border-b border-[var(--lms-canvas-border)] pb-3 text-sm">
      <TextLink href="/college/academics">Academic workspace</TextLink>
      <TextLink href="/college/programs">Programs</TextLink>
      <span aria-current="page" className="border-b-2 border-[var(--lms-primary)] pb-1 font-semibold text-foreground">Semester–Course Mapping</span>
    </nav>
    {curriculumData?.lookupFailures.length ? <Alert tone="warning" title="Curriculum lookup incomplete">
      Failed to refresh: {curriculumData.lookupFailures.join(", ")}.
      {" "}The last successful mappings for this college remain visible in read-only mode.
      {" "}Use Retry curriculum to load new values before editing.
    </Alert> : null}
    {curriculumData&&!curriculumData.staffingAvailable ? <Alert tone="warning" title="Faculty staffing warnings unavailable">
      The semester mappings are still available, but current active-delivery staffing could not be checked.
      {" "}<TextLink href="/college/semester-courses">Retry staffing read</TextLink>.
    </Alert> : null}
    <CollegeTermMappingRetained key={context.membership.collegeId}
      data={curriculumData&&curriculumData.lookupFailures.length===0?curriculumData:null} />
  </div>;
}
