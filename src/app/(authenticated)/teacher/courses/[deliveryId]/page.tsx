import { redirect } from "next/navigation";
import { facultyCourseTabHref } from "@/modules/courses/faculty-course-navigation";

export default async function FacultyCourseDefaultPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const { deliveryId } = await params;
  redirect(facultyCourseTabHref(deliveryId, "home"));
}
