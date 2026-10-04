import { redirect } from "next/navigation";

export default async function LearnerCourseRedirectPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const { deliveryId } = await params;
  redirect(`/learn/courses/${encodeURIComponent(deliveryId)}/home`);
}
