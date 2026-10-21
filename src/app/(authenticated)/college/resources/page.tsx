import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeContentAggregate } from "@/components/courses/college-content-aggregate";
import {CollegeContentAuthoringControl} from "@/components/courses/college-content-authoring-control";
import {getCollegeContentAuthoringOptions} from "@/modules/courses/college-content-authoring-service";
import {resourceMaterialsRuntimeEnabled} from "@/modules/courses/resource-material-readiness";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeContentQuerySchema, collegeContentSearchParams } from "@/modules/courses/college-content-aggregate-model";
import { listCollegeContentAggregate } from "@/modules/courses/college-content-aggregate-service";
import {collegeContentCsvHref} from "@/modules/courses/college-content-export-model";
import {CollegeResourceLastGood} from "@/components/college/college-resource-last-good";

export default async function CollegeResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <CollegeCourseMissingScope area="college"/>;
  const raw = collegeContentSearchParams(await searchParams);
  const parsed = collegeContentQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return (
      <div className="min-w-0 space-y-6 md:space-y-6">
        <PageHeader title="Resources" />
        <ErrorState title="Invalid resource filters"
          description="The title, status or page filter is invalid. No content was loaded."
          action={<Link href="/college/resources" className="md:min-h-9 inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)] font-semibold text-link underline lms-inline-link hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>} />
      </div>
    );
  }
  const [authoringResult, catalogueResult] = await Promise.allSettled([
    getCollegeContentAuthoringOptions(context,"RESOURCE"),
    listCollegeContentAggregate(context,"RESOURCE",parsed.data),
  ]);
  const authoring=authoringResult.status==="fulfilled"?authoringResult.value:null;
  const catalogue=catalogueResult.status==="fulfilled"?catalogueResult.value:null;
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Resources"
      actions={<Link href="/college/lessons" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Lessons</Link>} />
    {authoring?<CollegeContentAuthoringControl kind="RESOURCE" lessons={authoring.lessons}
      deliveries={authoring.deliveries} existing={authoring.existing}
      existingTruncated={authoring.existingTruncated} materialsEnabled={resourceMaterialsRuntimeEnabled()}/>:
      <div className="space-y-2">
        <ErrorState title="Could not load courses"
          description="Course selections for resources are unavailable; the existing list can still be viewed."
          action={<Link href="/college/resources" className="font-semibold text-link underline">Retry</Link>}/>
        <ErrorState title="Could not load lessons"
          description="Lesson selections for resource authoring are unavailable."
          action={<Link href="/college/resources" className="font-semibold text-link underline">Retry</Link>}/>
      </div>}
    <CollegeResourceLastGood
      key={context.user.id+":"+context.membership.id+":"+JSON.stringify(parsed.data)}
      data={catalogue}/>
    <Link download prefetch={false} href={collegeContentCsvHref("RESOURCE",parsed.data)}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 md:min-h-9 text-sm font-semibold text-link hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      Export filtered resource metadata CSV
    </Link>
  </div>;
}
