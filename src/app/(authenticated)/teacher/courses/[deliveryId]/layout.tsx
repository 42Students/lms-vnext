import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseTabNavigation } from "@/components/courses/faculty-course-tab-navigation";
import { listFacultyCourseDeliveries } from "@/modules/courses/faculty-course-service";

export default async function FacultyCourseTabLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ deliveryId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { deliveryId } = await params;
  // The route context always comes from current, persisted, active Faculty
  // teaching assignments. Never trust a caller's Section or cached role.
  const assignments = await listFacultyCourseDeliveries(context);
  const active = assignments.find((assignment) => assignment.deliveryId === deliveryId);
  if (!active) notFound();
  const sections = assignments
    .filter((assignment) => assignment.courseId === active.courseId)
    .map((assignment) => ({
      deliveryId: assignment.deliveryId,
      label: assignment.sectionName + " · " + assignment.academicPeriodName,
    }));
  return (
    <div className="space-y-5">
      <FacultyCourseTabNavigation
        deliveryId={deliveryId}
        courseName={active.courseName}
        sectionName={active.sectionName}
        teachingSections={sections}
      />
      {children}
    </div>
  );
}
