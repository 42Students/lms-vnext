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
        href={`/teacher/courses/${deliveryId}/home`}
        className="inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
      >
        ← Course workspace
      </Link>
      <PageHeader
        eyebrow="Faculty · Course"
        title="Students"
        description={`${delivery.courseName} · ${delivery.sectionName} · ${delivery.academicPeriodName}`}
      />
      <div className="flex justify-end">
        <Link href={"/teacher/courses/"+encodeURIComponent(delivery.deliveryId)+"/gradebook"}
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Published gradebook
        </Link>
      </div>
      <div className="flex justify-end">
        <Link href={"/teacher/courses/"+encodeURIComponent(delivery.deliveryId)+"/attendance-corrections"}
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Correction window &amp; request-history status
        </Link>
      </div>
      <FacultyCourseRoster
        learners={roster}
        sectionName={delivery.sectionName}
        deliveryId={delivery.deliveryId}
      />
    </div>
  );
}
