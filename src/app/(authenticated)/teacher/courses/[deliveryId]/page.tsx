import { redirect, notFound } from "next/navigation";
import { facultyCourseTabHref,validFacultyDefaultDeliveryId } from "@/modules/courses/faculty-course-navigation";

export default async function FacultyCourseDefaultPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const { deliveryId } = await params;
  if(!validFacultyDefaultDeliveryId(deliveryId))notFound();
  redirect(facultyCourseTabHref(deliveryId, "home"));
}
