import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
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

  return (
    <AdminOfferingLearningPage
      context={context}
      offeringId={offeringId}
      eyebrow="Super Admin · Courses"
      backHref="/admin/courses"
    />
  );
}
