import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeLearningDirectory } from "@/components/courses/college-learning-directory";
import { CollegeLessonCreateControl } from "@/components/courses/college-lesson-create-control";
import { getCollegeLessonAuthoringOptions } from "@/modules/courses/college-content-authoring-service";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeLessonQuerySchema } from "@/modules/courses/college-learning-directory-model";
import { listCollegeLessons } from "@/modules/courses/college-learning-directory-service";
import { lessonsCsvHref } from "@/modules/courses/college-lessons-export-model";

type Search = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function CollegeLessonsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <CollegeCourseMissingScope area="college"/>;
  const params = await searchParams;
  const parsed = collegeLessonQuerySchema.safeParse(
    Object.fromEntries(Object.entries({
      q: first(params.q), status: first(params.status),
      offeringStatus: first(params.offeringStatus), pathStatus:first(params.pathStatus),
      offeringType:first(params.offeringType),departmentName:first(params.departmentName)||undefined,
      contentPresence:first(params.contentPresence),publishedContent:first(params.publishedContent),flaggedVisibility:first(params.flaggedVisibility),assignmentPresence:first(params.assignmentPresence),quizPresence:first(params.quizPresence),
      courseCode: first(params.courseCode)||undefined,
      programCode:first(params.programCode)||undefined,
      cohortCode:first(params.cohortCode)||undefined,
      periodCode:first(params.periodCode)||undefined,
      programStatus:first(params.programStatus),
      cohortStatus:first(params.cohortStatus),
      periodStatus:first(params.periodStatus),
      courseStatus:first(params.courseStatus),
      departmentCode:first(params.departmentCode)||undefined,
      contentType: first(params.contentType),
      contentLifecycle: first(params.contentLifecycle),
      sequenceFrom: first(params.sequenceFrom) || undefined,
      sequenceThrough: first(params.sequenceThrough) || undefined,
      lessonName: first(params.lessonName) || undefined,
      contentAudience:first(params.contentAudience),
      hiddenPublished:first(params.hiddenPublished),
      videoEvidence:first(params.videoEvidence),
      resourceEvidence:first(params.resourceEvidence),
      liveEvidence:first(params.liveEvidence),
      lessonId:first(params.lessonId)||undefined,
      offeringId:first(params.offeringId)||undefined,
      pathId:first(params.pathId)||undefined,
      minContentCount:first(params.minContentCount)||undefined,
      maxContentCount:first(params.maxContentCount)!==undefined && first(params.maxContentCount)!==""?first(params.maxContentCount):undefined,
      page: first(params.page),
      pageSize:first(params.pageSize),
    }).filter(([, value]) => value !== undefined)),
  );
  if (!parsed.success) return (
    <div className="space-y-5">
      <PageHeader eyebrow="College Admin · Courses & Content" title="Lessons" />
      <ErrorState title="Invalid lesson filters"
        description="The search, lesson status or page is invalid. No lesson data was loaded."
        action={<Link href="/college/lessons" className="font-semibold text-link lms-inline-link">Clear filters</Link>} />
    </div>
  );
  const authoringOptions=await getCollegeLessonAuthoringOptions(context);
  const courseChoices=[...new Map(authoringOptions.map(row=>[row.courseCode,{code:row.courseCode,name:row.courseName}])).values()];
  return <div className="min-w-0 overflow-x-clip space-y-4">
    <CollegeLessonCreateControl options={authoringOptions} />
    <Link prefetch={false} download href={lessonsCsvHref(parsed.data)}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
      Export filtered lessons CSV
    </Link>
    <Link href="/college/live-classes"
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
      View college live classes
    </Link>
    <CollegeLearningDirectory data={await listCollegeLessons(context, parsed.data)} courseChoices={courseChoices} />
  </div>;
}
