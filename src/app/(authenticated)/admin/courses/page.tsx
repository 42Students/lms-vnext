import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getAdminCourseWorkspace } from "@/modules/courses/admin-course-workspace";

export default async function SuperAdminCoursesPage() {
  const context =
    await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Courses"
          description="Course administration requires a college safety scope."
        />
        <Link href="/admin/lessons" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">Lessons directory →</Link>
        <Link href="/admin/course-progress" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">Course Progress directory →</Link>
        <Link href="/admin/assignments" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">Assignments directory →</Link>
        <Link href="/admin/quizzes" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">Quizzes directory →</Link>
        <EmptyState
          title="Select a college scope"
          description="Choose a college in the Super Admin scope selector before managing Courses, Offerings, Section deliveries or teaching assignments."
        />
      </div>
    );
  }

  const workspace =
    await getAdminCourseWorkspace(
      context,
      collegeId,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Courses"
        description="Course structure inside the selected college safety scope."
      />
      <Link href="/admin/lessons" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Lessons directory →</Link>
      <Link href="/admin/course-progress" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Course Progress →</Link>
      <Link href="/admin/assignments" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Assignments →</Link>
      <Link href="/admin/quizzes" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Quizzes →</Link>
      <AdminCourseOverview
        workspace={workspace}
        offeringBasePath="/admin/courses/offerings"
      />
    </div>
  );
}
