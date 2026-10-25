import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseRoster } from "@/components/courses/faculty-course-roster";
import {FacultyPrototypeStudentDirectory} from "@/components/courses/faculty-prototype-student-directory";
import {getFacultyCourseHomeSignals} from "@/modules/courses/faculty-course-home-service";
import {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
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
    // Resolve historical numeric class IDs only through this faculty member's
    // authorized, same-course teaching assignments. Never treat a numeric
    // class reference as an unrestricted tenant-wide roster lookup.
    const legacyClassId=/^[1-9]\d{0,9}$/.test(cls)?Number(cls):null;
    const target=assigned.find(item=>item.courseId===current.courseId&&
      (item.sectionId===cls||item.deliveryId===cls||
       (legacyClassId!==null&&item.legacyClassId===legacyClassId)));
    // Legacy bookmarked ?cls values that are missing or no longer assigned
    // fall back to this verified teaching section instead of leaking
    // another class or throwing away the teacher's course context.
    if(!target)redirect("/teacher/courses/"+encodeURIComponent(deliveryId)+"/students");
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
      <h1 className="sr-only">Students</h1>
      <h2 className="text-xl font-semibold leading-7 text-[var(--lms-heading)]">Class list</h2>
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
  const signalResult=await getFacultyCourseWorkspace(context,deliveryId)
    .then(workspace=>getFacultyCourseHomeSignals(context,workspace))
    .catch(()=>null);

  return (
    <div className="min-w-0 max-w-full space-y-5">
      <h1 className="sr-only">Students</h1>
      <p className="sr-only">{delivery.courseName} · {delivery.sectionName} · {delivery.academicPeriodName}</p>
      <FacultyPrototypeStudentDirectory
        learners={roster} signals={signalResult} deliveryId={delivery.deliveryId}/>
      <details className="border-t border-[#e5ebf2] pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#078191]">Detailed roster, contacts and CSV export</summary>
        <div className="mt-4">
      <FacultyCourseRoster
        key={delivery.deliveryId}
        learners={roster}
        sectionName={delivery.sectionName}
        deliveryId={delivery.deliveryId}
        advanced
      />
        </div>
      </details>
    </div>
  );
}
