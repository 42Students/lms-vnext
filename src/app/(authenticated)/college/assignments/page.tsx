import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAssessmentAggregate } from "@/components/courses/college-assessment-aggregate";
import {CollegeAssignmentCreate} from "@/components/courses/college-assignment-create";
import {getCollegeAssignmentAuthoringOptions} from "@/modules/courses/college-assignment-authoring-options";
import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeAssessmentListQuerySchema, parseCollegeAssessmentQuery } from "@/modules/courses/college-assessment-aggregate-model";
import { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";

type SearchParams = Record<string, string | string[] | undefined>;
function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CollegeAssignmentsPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <CollegeCourseMissingScope area="college"/>;
  const params = await searchParams;
  const raw = { q: one(params.q), status: one(params.status), courseCode: one(params.courseCode)||undefined,periodCode:one(params.periodCode)||undefined,cohortCode:one(params.cohortCode)||undefined,programCode:one(params.programCode)||undefined, scope:one(params.scope),duePresence:one(params.duePresence),dueWindow:one(params.dueWindow), page: one(params.page) };
  const validation = collegeAssessmentListQuerySchema.safeParse(
    Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined)),
  );
  if (!validation.success || validation.data.status === "CLOSED") {
    return (
      <div className="min-w-0 overflow-x-clip space-y-4">
        <PageHeader title="Assignments" />
        <ErrorState title="Invalid assessment filters"
          description="The requested search, status or page is invalid. No records were loaded."
          action={<Link href="/college/assignments" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Clear filters</Link>}/>
      </div>
    );
  }
  const data = await listCollegeAssessmentAggregate(
    context, "ASSIGNMENT", parseCollegeAssessmentQuery("ASSIGNMENT", validation.data),
  );
  const lessons=await getCollegeAssignmentAuthoringOptions(context);
  return <div className="space-y-4">
    <CollegeAssignmentCreate lessons={lessons} deliveries={data.reviewDeliveries}/>
    <CollegeAssessmentAggregate data={data}/>
  </div>;
}
