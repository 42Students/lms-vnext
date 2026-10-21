import { Suspense } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Disclosure } from "@/components/ui/disclosure";
import {ErrorState} from "@/components/ui/error-state";
import {CoursesServiceError} from "@/modules/courses/errors";
import {AuthorizationError} from "@/modules/permissions/policy";
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

function AttendanceDetailLoading() {
 return <section className="flex min-h-48 items-center justify-center" aria-busy="true" aria-label="Loading attendance">
  <span role="status" className="inline-flex items-center gap-3 text-sm text-muted-foreground">
   <svg aria-hidden="true" viewBox="0 0 24 24" width="34" height="34" fill="none"
     stroke="currentColor" strokeWidth="2" className="animate-spin text-primary-text">
    <path d="M12 2a10 10 0 1 1-10 10"/>
   </svg>
   Loading attendance…
  </span>
 </section>;
}
type AttendanceDetailParams={params:Promise<{deliveryId:string}>;searchParams:Promise<{sessionId?:string;cls?:string}>};
export default function FacultyCourseAttendancePage(props:AttendanceDetailParams) {
 return <Suspense fallback={<AttendanceDetailLoading/>}>
  <FacultyCourseAttendanceContent {...props}/>
 </Suspense>;
}
async function FacultyCourseAttendanceContent({
  params,
  searchParams,
}: AttendanceDetailParams) {
  const context = await getCurrentRequestContext();
  const { deliveryId } = await params;
  const query = await searchParams;
  // Render only sections covered by the faculty member's CURRENT teaching
  // assignments. A numeric legacy cls without a persisted crosswalk is never
  // silently routed into some unrelated section.
  const assigned=await listFacultyCourseDeliveries(context);
  const current=assigned.find(item=>item.deliveryId===deliveryId);
  if(!current)notFound();
  const sections=assigned.filter(item=>item.courseId===current.courseId);
  if(query.cls){
    const target=sections.find(item=>item.sectionId===query.cls||
      item.deliveryId===query.cls||item.sectionCode===query.cls);
    if(!target){
      // A retired legacy ?cls value cannot select a foreign section. Use
      // the known-safe selected delivery and discard the unsupported alias.
      redirect("/teacher/courses/"+encodeURIComponent(deliveryId)+"/attendanceDetail");
    }
    redirect("/teacher/courses/"+encodeURIComponent(target.deliveryId)+
      "/attendanceDetail"+(query.sessionId&&target.deliveryId===deliveryId?
       "?sessionId="+encodeURIComponent(query.sessionId):""));
  }

  let data:Awaited<ReturnType<typeof getFacultyAttendanceWorkspace>>;
  try {
    data=await getFacultyAttendanceWorkspace(context,deliveryId);
  }catch(error){
    if(error instanceof AuthorizationError||error instanceof CoursesServiceError)throw error;
    return <div className="min-w-0 space-y-4">
      <ErrorState title="Could not load the attendance roster"
        description="Failed to load students or attendance. Your existing marks have not been changed."
        action={<Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/attendanceDetail"}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>}/>
      <Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/home"}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">← Course workspace</Link>
    </div>;
  }

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
    <div className="min-w-0 max-w-full space-y-4">
      {sections.length>1?<form method="get"
        action={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/attendanceDetail"}
        aria-label="Teaching section selector"
        className="flex min-w-0 flex-wrap items-end gap-3 border-b border-border pb-3">
        <label className="grid min-w-[160px] flex-1 gap-1 text-sm font-semibold text-body">
          Class
          <Select name="cls" defaultValue={deliveryId}
            className="min-h-11 w-full min-w-[160px] md:min-h-9">
            <option value="" disabled>Select class</option>
            {sections.map(item=><option key={item.deliveryId} value={item.deliveryId}>
              {item.sectionName} ({item.sectionCode})
            </option>)}
          </Select>
        </label>
        <Button type="submit" variant="secondary" className="min-h-11 md:min-h-9">
          View class
        </Button>
        <p className="w-full text-xs text-muted-foreground">
          Choose a class to see that section&#39;s attendance. Save any changed marks before switching.
        </p>
      </form>:null}
      <p className="text-sm text-body">See your attendance record and class-wise status in one place.</p>
      <nav aria-label="Course attendance shortcuts" className="flex min-w-0 flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href={`/teacher/courses/${deliveryId}/home`}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] text-sm font-semibold text-primary-text md:min-h-[var(--lms-control-height)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
      >
        ← Course workspace
      </Link>

      <Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/session-coverage"}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Review session coverage →
      </Link>
      </nav>
      <FacultyAttendanceWorkspace
        key={`${deliveryId}:${initialSessionId ?? "report"}`}
        workspace={workspace}
        initialSessionId={initialSessionId}
      />
      <Disclosure title="Advanced attendance session scheduling" className="border-t border-border" contentClassName="min-w-0 pb-4">
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
      </Disclosure>
    </div>
  );
}
