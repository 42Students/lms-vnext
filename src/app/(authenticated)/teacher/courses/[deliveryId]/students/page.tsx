import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseRoster } from "@/components/courses/faculty-course-roster";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { CoursesServiceError } from "@/modules/courses/errors";
import { AuthorizationError } from "@/modules/permissions/policy";
import { ZodError } from "zod";
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
  // Do not turn an unauthorized or malformed delivery into an empty roster.
  // Only transient roster read failures receive the inline legacy retry.
  let loaded:Awaited<ReturnType<typeof getFacultyDeliveryRoster>>;
  try{
    loaded=await getFacultyDeliveryRoster(context,deliveryId);
  }catch(error){
    if(error instanceof CoursesServiceError||error instanceof AuthorizationError||
       error instanceof ZodError)throw error;
    return <div className="min-w-0 space-y-5">
      <PageHeader title="Students"/>
      <Alert tone="error">
        <strong>We couldn&apos;t load the class roster. Check your connection and try again.</strong>
        <Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/students"}
          className="lms-inline-link font-semibold underline underline-offset-4">
          Retry roster
        </Link>
      </Alert>
    </div>;
  }
  const {delivery,roster}=loaded;

  return (
    <div className="min-w-0 max-w-full space-y-5">
      <PageHeader
        eyebrow="Faculty · Course"
        title="Students"
        description={`${delivery.courseName} · ${delivery.sectionName} · ${delivery.academicPeriodName}`}
        actions={<Link href={`/teacher/courses/${encodeURIComponent(deliveryId)}/home`} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">← Course workspace</Link>}
      />
      <FacultyCourseRoster
        key={delivery.deliveryId}
        learners={roster}
        sectionName={delivery.sectionName}
        deliveryId={delivery.deliveryId}
      />
    </div>
  );
}
