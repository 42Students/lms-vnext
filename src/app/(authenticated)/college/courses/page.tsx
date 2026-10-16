import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getAdminCourseWorkspace } from "@/modules/courses/admin-course-workspace";

export default async function CollegeCoursesPage() {
  const context =
    await getCurrentRequestContext();
  const membership = context.membership;

  if (!membership) {
    redirect("/dashboard");
  }

  const workspace =
    await getAdminCourseWorkspace(
      context,
      membership.collegeId,
      true,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Courses"
      />
      <AdminCourseOverview
        workspace={workspace}
        offeringBasePath="/college/courses/offerings"
        allowOfferingLifecycle
      />
    </div>
  );
}
