import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminOfferingLearningPage } from "@/components/courses/admin-offering-learning-page";

export default async function CollegeOfferingLearningPage({
  params,
}: {
  params: Promise<{
    offeringId: string;
  }>;
}) {
  const context =
    await getCurrentRequestContext();

  if (!context.membership) {
    redirect("/dashboard");
  }

  const { offeringId } = await params;

  return (
    <AdminOfferingLearningPage
      context={context}
      offeringId={offeringId}
      eyebrow="College Admin · Courses"
      backHref="/college/courses"
    />
  );
}
