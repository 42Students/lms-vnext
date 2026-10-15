import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAssessmentAggregate } from "@/components/courses/college-assessment-aggregate";
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
  if (!context.membership) redirect("/dashboard");
  const params = await searchParams;
  const raw = { q: one(params.q), status: one(params.status), courseCode: one(params.courseCode)||undefined, page: one(params.page) };
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
  return <CollegeAssessmentAggregate data={data} />;
}
