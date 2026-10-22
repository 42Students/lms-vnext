import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { resolveSuperAdminOfferingDetail } from "@/modules/admin-ui/super-admin-offering-detail";
import { AdminOfferingLearningPage } from "@/components/courses/admin-offering-learning-page";

export default async function SuperAdminOfferingLearningPage({
  params,
  searchParams,
}: {
  params: Promise<{ offeringId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context =
    await getCurrentRequestContext();

  if (!context.adminScope?.collegeId) {
    redirect("/admin/courses");
  }

  const { offeringId } = await params;
  if (!(await resolveSuperAdminOfferingDetail(context, offeringId))) notFound();
  const requestedDeliveryId = (await searchParams)["deliveryId"];
  const deliveryId = typeof requestedDeliveryId === "string" && z.uuid().safeParse(requestedDeliveryId).success
    ? requestedDeliveryId : null;

  return (
    <div className="min-w-0 max-w-full">
      <AdminOfferingLearningPage
        context={context}
        offeringId={offeringId}
        deliveryId={deliveryId}
        backHref="/admin/courses"
      />
    </div>
  );
}
