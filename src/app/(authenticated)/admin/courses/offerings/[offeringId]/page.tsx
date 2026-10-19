import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { resolveSuperAdminOfferingDetail } from "@/modules/admin-ui/super-admin-offering-detail";
import { AdminOfferingLearningPage } from "@/components/courses/admin-offering-learning-page";

export default async function SuperAdminOfferingLearningPage({
  params,
}: {
  params: Promise<{
    offeringId: string;
  }>;
}) {
  const context =
    await getCurrentRequestContext();

  if (!context.adminScope?.collegeId) {
    redirect("/admin/courses");
  }

  const { offeringId } = await params;
  if (!(await resolveSuperAdminOfferingDetail(context, offeringId))) notFound();

  return (
    <div className="min-w-0">
      <AdminOfferingLearningPage
      context={context}
      offeringId={offeringId}
      backHref="/admin/courses"
      />
    </div>
  );
}
