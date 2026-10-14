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
  const query = adminAssessmentQuerySchema.safeParse({ q: raw.q, status: raw.status, page: raw.page });
  if (!query.success) return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Quizzes" />
    <ErrorState title="Invalid quiz filters" description="Check search, status and page."
      action={<Link href="/admin/quizzes" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Quizzes" />
    <EmptyState title="Choose a college" description="Select a college scope before opening its quizzes directory." />
  </div>;
  const data = await listCollegeAssessmentAggregate(context, "QUIZ", query.data);
  return <AdminAssessmentDirectory data={data} />;
}
