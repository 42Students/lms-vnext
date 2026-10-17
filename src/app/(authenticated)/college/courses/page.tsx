import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getAdminCourseWorkspace } from "@/modules/courses/admin-course-workspace";

export default async function CollegeCoursesPage({searchParams}:{searchParams:Promise<{duplicate?:string|string[]}>}) {
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

  const raw=await searchParams;
  const duplicateCourseId=typeof raw.duplicate==="string"&&/^[a-f0-9-]{36}$/i.test(raw.duplicate)?raw.duplicate:undefined;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Courses"
      />
      <AdminCourseOverview
        workspace={workspace}
        duplicateCourseId={duplicateCourseId}
        offeringBasePath="/college/courses/offerings"
        allowOfferingLifecycle
      />
    </div>
  );
}
