import { Alert } from "@/components/ui/alert";
import { Tabs } from "@/components/ui/tabs";
import { loadCourseScope } from "@/modules/courses/scope";
import {LessonPageSizePreference} from "@/components/courses/lesson-page-size-preference";
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
  if(!context.membership)return <div className="min-w-0 space-y-4">
    <PageHeader title="Lessons" />
    <Alert tone="warning" title="Admin not assigned to a college">
      You must be assigned to a college to view and manage lessons. Contact your administrator.
    </Alert>
  </div>;
  const params = await searchParams;
  // A historical lesson bookmark may identify a course by UUID. Resolve it
  // within this membership's college; never guess a legacy numeric ID.
  const legacyCourseId = first(params.courseId);
  let verifiedCourseCode: string | undefined;
  if (legacyCourseId !== undefined) {
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(legacyCourseId)) {
      return <div className="min-w-0 space-y-4"><PageHeader title="Lessons" />
        <ErrorState title="Course link needs updating"
          description="This old course identifier cannot be matched safely. Choose the course in the lesson filters."
          action={<Link href="/college/lessons">Choose a course</Link>} /></div>;
    }
    const course = await loadCourseScope(legacyCourseId).catch(() => null);
    if (!course || course.collegeId !== context.membership.collegeId ||
        (first(params.courseCode) && first(params.courseCode)!.toLowerCase() !== course.code.toLowerCase())) {
      return <div className="min-w-0 space-y-4"><PageHeader title="Lessons" />
        <ErrorState title="Course not available"
          description="The course is not available in your selected college."
          action={<Link href="/college/lessons">Choose a course</Link>} /></div>;
    }
    verifiedCourseCode = course.code;
  }
  const parsed = collegeLessonQuerySchema.safeParse(
    Object.fromEntries(Object.entries({
      q: first(params.q), status: first(params.status),
      offeringStatus: first(params.offeringStatus), pathStatus:first(params.pathStatus),
      offeringType:first(params.offeringType),departmentName:first(params.departmentName)||undefined,
      contentPresence:first(params.contentPresence),publishedContent:first(params.publishedContent),flaggedVisibility:first(params.flaggedVisibility),assignmentPresence:first(params.assignmentPresence),quizPresence:first(params.quizPresence),
      courseCode: verifiedCourseCode ?? first(params.courseCode) ?? undefined,
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
    <div className="min-w-0 space-y-4">
      <PageHeader title="Lessons" />
      <ErrorState title="Invalid lesson filters"
        description="The search, lesson status or page is invalid. No lesson data was loaded."
        action={<Link href="/college/lessons" className="lms-inline-link inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline min-[768px]:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>} />
    </div>
  );
  const authoringOptions=await getCollegeLessonAuthoringOptions(context);
  const courseChoices=[...new Map(authoringOptions.map(row=>[row.courseCode,{code:row.courseCode,name:row.courseName}])).values()];
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <LessonPageSizePreference storageKey="college-lessons-page-size" />
    <PageHeader title="Lessons" description="Find lessons by course or lesson name."
      actions={<Link href="/college/courses"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-white px-4 text-sm font-semibold text-primary-text md:min-h-9">Course offerings</Link>} />
    <Tabs ariaLabel="Courses & Content" value="lessons" renderPanel={false} items={[
      {value:"courses",label:"Courses",href:"/college/courses"},
      {value:"lessons",label:"Lessons",href:"/college/lessons"},
      {value:"video",label:"Video",href:"/college/lesson-content?type=video"},
      {value:"resources",label:"Resources",href:"/college/lesson-content?type=resources"},
      {value:"live-classes",label:"Live Classes",href:"/college/lesson-content?type=live-classes"},
      {value:"assignments",label:"Assignments",href:"/college/assignments"},
      {value:"quizzes",label:"Quizzes",href:"/college/quizzes"},
      {value:"course-progress",label:"Progress",href:"/college/course-progress"},
    ]} />
    <CollegeLearningDirectory
    data={await listCollegeLessons(context, parsed.data)}
    showHeader={false}
    courseChoices={courseChoices}
    prepend={<div className="flex min-w-0 flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-start">

    <CollegeLessonCreateControl options={authoringOptions} />
    <Link prefetch={false} download href={lessonsCsvHref(parsed.data)}
      className="inline-flex min-h-11 w-full items-center justify-center md:min-h-9 md:w-auto rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-4 text-sm font-[650] text-[var(--lms-body-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      Export filtered lessons CSV
    </Link>
    <Link href="/college/live-classes"
      className="inline-flex min-h-11 w-full items-center justify-center md:min-h-9 md:w-auto rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-4 text-sm font-[650] text-[var(--lms-body-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      View college live classes
    </Link>
    </div>}
  />
  </div>;
}
