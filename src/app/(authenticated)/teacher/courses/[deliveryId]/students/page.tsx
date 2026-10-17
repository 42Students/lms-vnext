import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseRoster } from "@/components/courses/faculty-course-roster";
import { PageHeader } from "@/components/ui/page-header";
import { getFacultyDeliveryRoster } from "@/modules/attendance/faculty-service";
import {listFacultyCourseDeliveries} from "@/modules/courses/faculty-course-service";

export default async function FacultyCourseStudentsPage({
  params,searchParams,
}: {
  params: Promise<{ deliveryId: string }>;
  searchParams:Promise<{cls?:string}>;
}) {
  const context = await getCurrentRequestContext();
  const { deliveryId } = await params;
  const cls=(await searchParams).cls;
  if(cls){
    const assigned=await listFacultyCourseDeliveries(context);
    const current=assigned.find(item=>item.deliveryId===deliveryId);
    if(!current)notFound();
    const target=assigned.find(item=>item.courseId===current.courseId&&
      (item.sectionId===cls||item.deliveryId===cls));
    if(!target)notFound();
    redirect("/teacher/courses/"+encodeURIComponent(target.deliveryId)+"/students");
  }
  const { delivery, roster } =
    await getFacultyDeliveryRoster(
      context,
      deliveryId,
    );

  return (
    <div className="space-y-5">
      <Link
        href={`/teacher/courses/${deliveryId}/home`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
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
        deliveryId={delivery.deliveryId}
      />
    </div>
  );
}
