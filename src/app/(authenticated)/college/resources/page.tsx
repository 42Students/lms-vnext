import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import {CollegeContentAuthoringControl} from "@/components/courses/college-content-authoring-control";
import {getCollegeContentAuthoringOptions,collegeExistingContentFiltersFromSearch} from "@/modules/courses/college-content-authoring-service";
import {resourceMaterialsRuntimeEnabled} from "@/modules/courses/resource-material-readiness";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeContentQuerySchema, collegeContentSearchParams } from "@/modules/courses/college-content-aggregate-model";
import { listCollegeContentAggregate } from "@/modules/courses/college-content-aggregate-service";
import {collegeContentCsvHref} from "@/modules/courses/college-content-export-model";
import {CollegeResourceLastGood} from "@/components/college/college-resource-last-good";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

export default async function CollegeResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <CollegeCourseMissingScope area="college"/>;
  const supplied=await searchParams;
  const raw = collegeContentSearchParams(supplied);
  const parsed = collegeContentQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return (
      <div className="min-w-0 space-y-6 md:space-y-6">
        <PageHeader title="Resources" />
        <ErrorState title="Invalid resource filters"
          description="The title, status or page filter is invalid. No content was loaded."
          action={<TextLink href="/college/resources" className="md:min-h-9 inline-flex min-h-11 items-center">Clear filters</TextLink>} />
      </div>
    );
  }
  const { courseCode, lessonId, programCode, cohortCode, periodCode, departmentName, offeringType, lessonStatus, pathStatus, deliveryId, offeringStatus, pageSize, ...requiredFilters } = parsed.data;
  const filters = {
    ...requiredFilters,
    ...(courseCode !== undefined ? { courseCode } : {}),
    ...(lessonId !== undefined ? { lessonId } : {}),
    ...(programCode !== undefined ? { programCode } : {}),
    ...(cohortCode !== undefined ? { cohortCode } : {}),
    ...(periodCode !== undefined ? { periodCode } : {}),
    ...(departmentName !== undefined ? { departmentName } : {}),
    ...(offeringType !== undefined ? { offeringType } : {}),
    ...(lessonStatus !== undefined ? { lessonStatus } : {}),
    ...(pathStatus !== undefined ? { pathStatus } : {}),
    ...(deliveryId !== undefined ? { deliveryId } : {}),
    ...(offeringStatus !== undefined ? { offeringStatus } : {}),
    ...(pageSize !== undefined ? { pageSize } : {}),
  };
  const [authoringResult, catalogueResult] = await Promise.allSettled([
    getCollegeContentAuthoringOptions(context,"RESOURCE",collegeExistingContentFiltersFromSearch(supplied)),
    listCollegeContentAggregate(context,"RESOURCE",filters),
  ]);
  const authoring=authoringResult.status==="fulfilled"?authoringResult.value:null;
  const catalogue=catalogueResult.status==="fulfilled"?catalogueResult.value:null;
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Resources"
      description="Give a lesson reading material: files, links and notes, together in one resource."
      actions={<ButtonLink variant="secondary" href="/college/lessons">Lessons</ButtonLink>} />
    <nav className="flex flex-wrap items-center gap-5 border-b border-[var(--lms-canvas-border)]" aria-label="Courses & Content">
      <TextLink variant="bare" href="/college/lessons" className="inline-flex min-h-11 items-center border-b-2 border-transparent text-sm text-body md:min-h-9">Lessons</TextLink>
      <TextLink href="/college/resources" aria-current="page"
        className="inline-flex min-h-11 items-center border-b-2 border-[var(--lms-primary)] text-sm md:min-h-9">Resources</TextLink>
      <TextLink variant="bare" href="/college/videos" className="inline-flex min-h-11 items-center border-b-2 border-transparent text-sm text-body md:min-h-9">Videos</TextLink>
    </nav>
    {authoring?<CollegeContentAuthoringControl kind="RESOURCE" lessons={authoring.lessons}
      deliveries={authoring.deliveries} existing={authoring.existing}
      existingTruncated={authoring.existingTruncated} existingPage={authoring.existingPage}
      existingFilters={authoring.existingFilters} dependencyErrors={authoring.dependencyErrors} materialsEnabled={resourceMaterialsRuntimeEnabled()}/>:
      <div className="space-y-2">
        <ErrorState title="Could not load courses"
          description="Course selections for resources are unavailable; the existing list can still be viewed."
          action={<TextLink href="/college/resources">Retry</TextLink>}/>
        <ErrorState title="Could not load lessons"
          description="Lesson selections for resource authoring are unavailable."
          action={<TextLink href="/college/resources">Retry</TextLink>}/>
      </div>}
    <CollegeResourceLastGood
      key={context.user.id+":"+context.membership.id+":"+JSON.stringify(filters)}
      data={catalogue}/>
    <ButtonLink variant="secondary" download prefetch={false} href={collegeContentCsvHref("RESOURCE",filters)}>
      Export filtered resource metadata CSV
    </ButtonLink>
  </div>;
}
