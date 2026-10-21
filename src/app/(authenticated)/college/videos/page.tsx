import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeContentAggregate } from "@/components/courses/college-content-aggregate";
import {CollegeContentAuthoringControl} from "@/components/courses/college-content-authoring-control";
import {getCollegeContentAuthoringOptions} from "@/modules/courses/college-content-authoring-service";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeContentQuerySchema, collegeContentSearchParams } from "@/modules/courses/college-content-aggregate-model";
import { listCollegeContentAggregate } from "@/modules/courses/college-content-aggregate-service";
import { collegeContentCsvHref } from "@/modules/courses/college-content-export-model";

export default async function CollegeVideosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <CollegeCourseMissingScope area="Video"/>;
  const raw = collegeContentSearchParams(await searchParams);
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
    getCollegeContentAuthoringOptions(context,"YOUTUBE"),
    listCollegeContentAggregate(context,"VIDEO",parsed.data),
  ]);
  const authoring=authoringResult.status==="fulfilled"?authoringResult.value:null;
  const catalogue=catalogueResult.status==="fulfilled"?catalogueResult.value:null;
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Video" eyebrow="College Admin · Courses & Content"
      actions={<Link href="/college/lessons" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Lessons</Link>} />
    {authoring?<CollegeContentAuthoringControl kind="YOUTUBE" lessons={authoring.lessons} deliveries={authoring.deliveries}
      existing={authoring.existing} existingTruncated={authoring.existingTruncated} />:
      <ErrorState title="Could not load courses or lessons"
        description="Courses, Faculty, Lessons or Sections are unavailable for video authoring. Existing videos can still be browsed."
        action={<Link href="/college/videos" className="font-semibold text-link underline">Retry</Link>} />}
    <p className="text-sm text-muted-foreground" role="note">
      Direct video-file uploads from the old LMS are not supported by this authoring form yet.
      Existing uploaded videos remain in the catalogue; to add a new video, use a YouTube link
      until signed-upload authoring and secure playback are available.
    </p>
    {catalogue?<CollegeContentAggregate showHeader={false} data={catalogue}/>:
      <ErrorState title="Couldn't refresh videos" description="The video catalogue is temporarily unavailable."
        action={<Link href="/college/videos" className="font-semibold text-link underline">Retry</Link>} />}
    <div className="flex min-w-0 flex-wrap items-center justify-end border-t border-border pt-3 print:hidden">
      <Link prefetch={false} download href={collegeContentCsvHref("VIDEO",parsed.data)}
        className="inline-flex min-h-11 max-w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Export filtered video metadata CSV
      </Link>
    </div>
  </div>;
}
