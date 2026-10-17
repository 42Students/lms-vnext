import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeLearningDirectory } from "@/components/courses/college-learning-directory";
import { CollegeLearnerProgressReport } from "@/components/courses/college-learner-progress-report";
import { getCollegeLearnerProgressReport } from "@/modules/courses/college-learner-progress-service";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeProgressQuerySchema } from "@/modules/courses/college-learning-directory-model";
import { listCollegeCourseProgress } from "@/modules/courses/college-learning-directory-service";
import {collegeProgressCsvHref} from "@/modules/courses/college-progress-export-model";

type Search = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function CollegeCourseProgressPage({ searchParams }: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <CollegeCourseMissingScope area="college"/>;
  const params = await searchParams;
  const parsed = collegeProgressQuerySchema.safeParse(
    Object.fromEntries(Object.entries({
      q: first(params.q), status: first(params.status),courseCode:first(params.courseCode)||undefined,
      programCode:first(params.programCode)||undefined,
      periodCode:first(params.periodCode)||undefined,
      cohortCode:first(params.cohortCode)||undefined,
      departmentName:first(params.departmentName)||undefined,
      activityState:first(params.activityState),
      completionEvidence:first(params.completionEvidence),learningPathPresence:first(params.learningPathPresence),publishedPathPresence:first(params.publishedPathPresence),
      offeringType:first(params.offeringType)||undefined,
      programStatus:first(params.programStatus),
      cohortStatus:first(params.cohortStatus),
      periodStatus:first(params.periodStatus),
      courseStatus:first(params.courseStatus),
      departmentCode:first(params.departmentCode)||undefined,
      lessonPresence:first(params.lessonPresence),
      assignmentPresence:first(params.assignmentPresence),
      quizPresence:first(params.quizPresence),
      resourcePresence:first(params.resourcePresence),
      liveClassPresence:first(params.liveClassPresence),
      videoContentState:first(params.videoContentState),
      publishedContentState:first(params.publishedContentState),
      hiddenContentState:first(params.hiddenContentState),
      sharedContentState:first(params.sharedContentState),
      sectionContentState:first(params.sectionContentState),
      offeringId:first(params.offeringId)||undefined,
      draftContentState:first(params.draftContentState),
      archivedContentState:first(params.archivedContentState),
      page: first(params.page),
    }).filter(([, value]) => value !== undefined)),
  );
  if (!parsed.success) return (
    <div className="space-y-5">
      <PageHeader eyebrow="College Admin · Courses & Content" title="Progress" />
      <ErrorState title="Invalid course progress filters"
        description="The search, offering status or page is invalid. No activity was loaded."
        action={<Link href="/college/course-progress" className="font-semibold text-primary-text">Clear filters</Link>} />
    </div>
  );
  const report=await getCollegeLearnerProgressReport(context,{
    offeringId:first(params.offeringId)||undefined,
    deliveryId:first(params.deliveryId)||undefined,
  });
  return <div className="space-y-4">
    <CollegeLearnerProgressReport data={report}/>
    <Link prefetch={false} download href={collegeProgressCsvHref(parsed.data)}
      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Export recorded course activity CSV
    </Link>
    <CollegeLearningDirectory data={await listCollegeCourseProgress(context, parsed.data)} />
  </div>;
}
