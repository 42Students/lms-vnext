import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeContentAggregate } from "@/components/courses/college-content-aggregate";
import {CollegeContentAuthoringControl} from "@/components/courses/college-content-authoring-control";
import {getCollegeContentAuthoringOptions,collegeExistingContentFiltersFromSearch} from "@/modules/courses/college-content-authoring-service";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeContentQuerySchema, collegeContentSearchParams } from "@/modules/courses/college-content-aggregate-model";
import { listCollegeContentAggregate } from "@/modules/courses/college-content-aggregate-service";


export default async function CollegeVideosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <CollegeCourseMissingScope area="Videos"/>;
  const supplied=await searchParams;
  const raw = collegeContentSearchParams(supplied);
  const parsed = collegeContentQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader eyebrow="College Admin · Courses & Content" title="Video" />
        <ErrorState title="Invalid video filters"
          description="The title, status or page filter is invalid. No content was loaded."
          action={<Link href="/college/videos" className="min-h-11 md:min-h-9 inline-flex min-h-[var(--lms-control-height)] items-center font-semibold text-link underline lms-inline-link hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>} />
      </div>
    );
  }
  // Keep the catalogue usable when one authoring dependency is unavailable.
  const [authoringResult, catalogueResult] = await Promise.allSettled([
    getCollegeContentAuthoringOptions(context,"YOUTUBE",collegeExistingContentFiltersFromSearch(supplied)),
    listCollegeContentAggregate(context,"VIDEO",parsed.data),
  ]);
  const authoring=authoringResult.status==="fulfilled"?authoringResult.value:null;
  const catalogue=catalogueResult.status==="fulfilled"?catalogueResult.value:null;
  return <div data-module="courses-content" className="min-w-0 space-y-[var(--lms-space-4)]">
    <nav aria-label="Courses & Content" className="flex min-w-0 flex-wrap border-b border-[var(--lms-canvas-border)] text-sm font-semibold">
      {([{label:"Lessons",href:"/college/lessons"},{label:"Videos",href:"/college/videos"},
        {label:"Live classes",href:"/college/live-classes"},{label:"Resources",href:"/college/resources"}] as const).map(tab=>
        <Link key={tab.href} href={tab.href} aria-current={tab.label==="Videos"?"page":undefined}
         className={"inline-flex min-h-11 items-center border-b-[3px] px-4 md:min-h-9 "+
          (tab.label==="Videos"?"border-[var(--lms-teal-deep)] text-[var(--lms-teal-deep)]":
           "border-transparent text-body hover:border-border hover:text-link")}>{tab.label}</Link>)}
    </nav>
    <PageHeader title="Video" description="Upload a video or link a YouTube video to a lesson." eyebrow="College Admin · Courses & Content"
      actions={<Link href="/college/lessons" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Lessons</Link>} />
    <div className="grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-4)] lg:grid-cols-2">
      <section aria-label="Create a video" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <h2 className="text-[16px] font-semibold text-[var(--lms-heading)]">Add a video</h2>
        {authoring?<CollegeContentAuthoringControl kind="YOUTUBE" lessons={authoring.lessons} deliveries={authoring.deliveries}
          existing={authoring.existing} existingTruncated={authoring.existingTruncated} existingPage={authoring.existingPage}
          existingFilters={authoring.existingFilters} dependencyErrors={authoring.dependencyErrors} />:
          <ErrorState title="Could not load courses or lessons"
            description="Courses, Faculty, Lessons or Sections are unavailable for video authoring. Existing videos can still be browsed."
            action={<Link href="/college/videos" className="font-semibold text-link underline">Retry</Link>}/>}
        <p className="text-xs text-muted-foreground" role="note">
          Existing uploaded videos remain available. New files require signed upload and playback;
          until then, link a YouTube video to a lesson.
        </p>
      </section>
      <section aria-label="Existing Content" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <h2 className="text-[16px] font-semibold text-[var(--lms-heading)]">Existing Content</h2>
        {catalogue?<CollegeContentAggregate showHeader={false} data={catalogue}/>:
          <ErrorState title="Couldn't refresh videos" description="The video catalogue is temporarily unavailable."
            action={<Link href="/college/videos" className="font-semibold text-link underline">Retry</Link>}/>}
        <p className="text-xs text-muted-foreground">Choose a lesson to export legacy columns
          ID, Title, Type, Sequence, Points, Deadline, Duration, Active and Enabled as lesson-content.csv.</p>
      </section>
    </div>
  </div>;
}
