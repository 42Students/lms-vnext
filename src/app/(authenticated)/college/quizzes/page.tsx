import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAssessmentAggregate } from "@/components/courses/college-assessment-aggregate";
import {CollegeQuizCreate} from "@/components/courses/college-quiz-create";
import {getCollegeQuizAuthoringOptions} from "@/modules/courses/college-quiz-authoring-options";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeAssessmentListQuerySchema } from "@/modules/courses/college-assessment-aggregate-model";
import { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";

type SearchParams = Record<string, string | string[] | undefined>;
function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CollegeQuizzesPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <CollegeCourseMissingScope area="college"/>;
  const params = await searchParams;
  const raw = { q: one(params.q), status: one(params.status), courseCode: one(params.courseCode)||undefined,periodCode:one(params.periodCode)||undefined,cohortCode:one(params.cohortCode)||undefined,programCode:one(params.programCode)||undefined, scope:one(params.scope),duePresence:one(params.duePresence),dueWindow:one(params.dueWindow), results:one(params.results), page: one(params.page) };
  const validation = collegeAssessmentListQuerySchema.safeParse(
    Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined)),
  );
  if (!validation.success) {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="College Admin" title="Quizzes" />
        <ErrorState title="Invalid assessment filters"
          description="The requested search, status or page is invalid. No records were loaded." />
      </div>
    );
  }
  const data = await listCollegeAssessmentAggregate(context, "QUIZ", validation.data);
  const lessons=await getCollegeQuizAuthoringOptions(context);
  return <div className="space-y-4">
    <CollegeQuizCreate lessons={lessons} deliveries={data.reviewDeliveries}/>
    <CollegeAssessmentAggregate data={data}/>
  </div>;
}
