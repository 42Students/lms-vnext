import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminOfferingLearningPage } from "@/components/courses/admin-offering-learning-page";

export default async function CollegeOfferingLearningPage({
  params,
  searchParams,
}: {
  params: Promise<{
    offeringId: string;
  }>;
  searchParams:Promise<{deliveryId?:string|string[]}>;
}) {
  const context =
    await getCurrentRequestContext();

  if (!context.membership) {
    redirect("/dashboard");
  }

  const { offeringId } = await params;
  const query=await searchParams;
  const deliveryId=typeof query.deliveryId==="string"&&/^[a-f0-9-]{36}$/i.test(query.deliveryId)?query.deliveryId:null;

  return (
    <AdminOfferingLearningPage
      context={context}
      offeringId={offeringId}
      deliveryId={deliveryId}
      eyebrow="College Admin · Courses"
      backHref="/college/courses"
    />
  );
}
