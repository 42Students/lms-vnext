import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseRoster } from "@/components/courses/faculty-course-roster";
import { PageHeader } from "@/components/ui/page-header";
import { getFacultyDeliveryRoster } from "@/modules/attendance/faculty-service";

export default async function FacultyCourseStudentsPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { deliveryId } = await params;
  const { delivery, roster } =
    await getFacultyDeliveryRoster(
      context,
      deliveryId,
    );

  return (
    <div className="space-y-5">
      <Link
        href={`/teach/courses/${deliveryId}`}
        className="inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
      >
        ← Course workspace
      </Link>
      <PageHeader
        eyebrow="Faculty · Course"
        title="Students"
        description={`${delivery.courseName} · ${delivery.sectionName} · ${delivery.academicPeriodName}`}
      />
      <FacultyCourseRoster
        learners={roster}
        sectionName={delivery.sectionName}
      />
    </div>
  );
}
