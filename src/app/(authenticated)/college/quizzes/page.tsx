import Link from "next/link";
import { Banner } from "@/components/ui/banner";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAssessmentAggregate } from "@/components/courses/college-assessment-aggregate";
import {CollegeQuizCreate} from "@/components/courses/college-quiz-create";
import {getCollegeQuizAuthoringOptions} from "@/modules/courses/college-quiz-authoring-options";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeAssessmentListQuerySchema } from "@/modules/courses/college-assessment-aggregate-model";
import { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";

export const metadata={title:"Quizzes · 42LMS"};
type SearchParams = Record<string, string | string[] | undefined>;
function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CollegeQuizzesPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <div className="min-w-0 space-y-4">
    <PageHeader title="Quizzes" />
    <Banner tone="warning"><strong>Admin not assigned to a college</strong>
      <p>You must be assigned to a college to manage quizzes. Contact your administrator.</p>
    </Banner>
  </div>;
  const params = await searchParams;
  const raw = { q: one(params.q), status: one(params.status), courseCode: one(params.courseCode)||undefined,deliveryId: one(params.deliveryId)||undefined,periodCode:one(params.periodCode)||undefined,cohortCode:one(params.cohortCode)||undefined,programCode:one(params.programCode)||undefined, scope:one(params.scope),duePresence:one(params.duePresence),dueWindow:one(params.dueWindow), results:one(params.results), page: one(params.page) };
  const validation = collegeAssessmentListQuerySchema.safeParse(
    Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined)),
  );
  if (!validation.success) {
    return (
      <div className="min-w-0 max-w-full space-y-6">
        <PageHeader title="Quizzes" />
        <ErrorState title="Invalid assessment filters"
          description="The requested search, status or page is invalid. No records were loaded."
          action={<Link href="/college/quizzes" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 lms-inline-link">Clear filters</Link>} />
      </div>
    );
  }
  try {
    const [data, lessons] = await Promise.all([
      listCollegeAssessmentAggregate(context, "QUIZ", validation.data),
      getCollegeQuizAuthoringOptions(context),
    ]);
    return <CollegeAssessmentAggregate data={data}
      leading={<CollegeQuizCreate lessons={lessons} deliveries={data.reviewDeliveries}/>} />;
  } catch {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Quizzes" />
      <ErrorState title="Quizzes could not be loaded"
        description="The quiz list could not be refreshed. Your existing quizzes were not changed."
        action={<Link href="/college/quizzes" prefetch={false}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>}/>
    </div>;
  }
}
