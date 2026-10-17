import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { AdminAssessmentDirectory } from "@/components/courses/admin-assessment-read-directory";
import { adminAssessmentQuerySchema } from "@/modules/courses/admin-assessment-directory-model";
import { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";

export default async function SuperAdminQuizzesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const query = adminAssessmentQuerySchema.safeParse({ q: raw.q, status: raw.status, page: raw.page,
    courseCode:raw.courseCode,scope:raw.scope,results:raw.results });
  if (!query.success) return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Quizzes" />
    <ErrorState title="Invalid quiz filters" description="Check search, status and page."
      action={<Link href="/admin/quizzes" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Quizzes" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its quizzes." />
  </div>;
  const data = await listCollegeAssessmentAggregate(context, "QUIZ", query.data);
  return <div className="space-y-4">
    <a href={"/api/admin/quizzes/export?"+new URLSearchParams({q:query.data.q,status:query.data.status}).toString()}
     className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Export quizzes.csv</a>
    <AdminAssessmentDirectory data={data} />
  </div>;
}
