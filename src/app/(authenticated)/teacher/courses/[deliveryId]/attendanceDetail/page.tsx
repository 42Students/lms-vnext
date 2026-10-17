import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {FacultyAttendanceScheduleEditor} from "@/components/attendance/faculty-attendance-schedule-editor";
import {
  FacultyAttendanceWorkspace,
  type FacultyAttendanceWorkspaceData,
} from "@/components/attendance/faculty-attendance-workspace";
import { getFacultyAttendanceWorkspace } from "@/modules/attendance/faculty-service";
import {listFacultyCourseDeliveries} from "@/modules/courses/faculty-course-service";
import { resolveFacultyAttendanceDeepLink } from "@/modules/attendance/faculty-attendance-edit-state";

export default async function FacultyCourseAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ deliveryId: string }>;
  searchParams: Promise<{ sessionId?: string;cls?:string }>;
}) {
  const context = await getCurrentRequestContext();
  const { deliveryId } = await params;
  const query = await searchParams;
  if(query.cls){
    const assigned=await listFacultyCourseDeliveries(context);
    const current=assigned.find(item=>item.deliveryId===deliveryId);
    if(!current)notFound();
    const target=assigned.find(item=>item.courseId===current.courseId&&
      (item.sectionId===query.cls||item.deliveryId===query.cls));
    if(!target)notFound();
    redirect("/teacher/courses/"+encodeURIComponent(target.deliveryId)+
      "/attendanceDetail"+(query.sessionId&&target.deliveryId===deliveryId?
       "?sessionId="+encodeURIComponent(query.sessionId):""));
  }
  const data =
    await getFacultyAttendanceWorkspace(
      context,
      deliveryId,
    );

  const workspace: FacultyAttendanceWorkspaceData = {
    course: {
      deliveryId: data.course.deliveryId,
      courseName: data.course.courseName,
      courseCode: data.course.courseCode,
      sectionName: data.course.sectionName,
      sectionCode: data.course.sectionCode,
      academicPeriodName:
        data.course.academicPeriodName,
    },
    policy: data.policy,
    roster: data.roster,
    sessions: data.sessions.map((session) => ({
      ...session,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      markedAt:
        session.markedAt?.toISOString() ?? null,
    })),
    records: data.records.map((record) => ({
      ...record,
      markedAt: record.markedAt.toISOString(),
    })),
  };

  // Query-param navigation can reuse the same App Router component tree.
  // Remount only when the authorized deep-linked session changes, so a
  // report page already in memory cannot mask Calendar -> Mark mode.
  const initialSessionId = resolveFacultyAttendanceDeepLink(
    workspace.sessions,
    query.sessionId,
  );

  return (
    <div className="space-y-5">
      <Link
        href={`/teacher/courses/${deliveryId}/home`}
        className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
      >
        ← Course workspace
      </Link>

      <Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/session-coverage"}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
        Review session coverage →
      </Link>
      <FacultyAttendanceScheduleEditor
        deliveryId={deliveryId}
        sessions={data.sessions.flatMap(session=>
          session.updatedAt&&session.facultyMembershipId===context.membership?.id?[{
            id:session.id,title:session.title,
            description:session.description,location:session.location,
            startsAt:session.startsAt.toISOString(),
            endsAt:session.endsAt.toISOString(),
            marked:session.attendanceStatus==="MARKED",
            updatedAt:session.updatedAt.toISOString(),
          }]:[])}
      />
      <FacultyAttendanceWorkspace
        key={`${deliveryId}:${initialSessionId ?? "report"}`}
        workspace={workspace}
        initialSessionId={initialSessionId}
      />
    </div>
  );
}
