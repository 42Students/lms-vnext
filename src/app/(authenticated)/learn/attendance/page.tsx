import { Suspense } from "react";
import { AuthorizationError } from "@/modules/permissions/policy";
import Link from "next/link";
import {learnerAttendanceIstMonth,learnerAttendanceMonthSchema} from "@/modules/attendance/learner-attendance-filter-model";
import {learnerAttendanceMonthWindow} from "@/modules/attendance/learner-attendance-calendar-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerAttendanceWorkspace,
} from "@/components/attendance/learner-attendance-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import {
  getLearnerAttendanceWorkspace,
} from "@/modules/attendance/learner-service";

type AttendanceParams={month?:string|string[];deliveryId?:string|string[]};
function AttendanceLoading() {
 return <div className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading attendance">
  <PageHeader title="Attendance"/>
  <div aria-hidden="true" className="flex flex-wrap gap-2"><span className="h-8 w-24 animate-pulse rounded-lg bg-muted"/><span className="h-8 w-32 animate-pulse rounded-lg bg-muted"/></div>
  <div role="presentation" aria-hidden="true" className="overflow-x-auto rounded-lg border border-border">
   <div className="min-w-[500px] space-y-3 p-4">
    {[1,2,3,4,5].map(key=><div key={key} className="grid grid-cols-5 gap-3">
      {[1,2,3,4,5].map(cell=><span key={cell} className="h-7 animate-pulse rounded bg-muted"/>)}
    </div>)}
   </div>
  </div>
 </div>;
}
export default function LearnerAttendancePage({searchParams}:{searchParams:Promise<AttendanceParams>}) {
 return <Suspense fallback={<AttendanceLoading/>}>
  <LearnerAttendanceContent searchParams={searchParams}/>
 </Suspense>;
}
async function LearnerAttendanceContent({searchParams}:{searchParams:Promise<AttendanceParams>}) {
  const raw=await searchParams;
  const defaultMonth=learnerAttendanceIstMonth(new Date());
  const selected=learnerAttendanceMonthSchema.safeParse(raw.month).data??defaultMonth;
  const deliveryId=Array.isArray(raw.deliveryId)?raw.deliveryId[0]:raw.deliveryId;
  // Course attendance deep links remain scoped by the learner enrollment
  // service. An invalid or another-college delivery cannot become an empty list.
  const context =
    await getCurrentRequestContext();
  // Keep the requested IST month on a failed read; no records are fabricated.
  const loaded=await getLearnerAttendanceWorkspace(context,{
    window:learnerAttendanceMonthWindow(selected),
    ...(deliveryId?{deliveryId}:{}),
  }).then(workspace=>({ok:true as const,workspace}))
    .catch(error=>{if(error instanceof AuthorizationError)throw error;return {ok:false as const};});
  if(!loaded.ok)return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Attendance"/>
    <Alert tone="error" role="alert">
      <strong>Failed to load attendance.</strong>
      Something went wrong loading attendance for this month. No attendance records were changed.
      <Link href={"/learn/attendance?"+new URLSearchParams({month:selected}).toString()}
        className="lms-inline-link font-semibold underline underline-offset-4">
        Retry attendance
      </Link>
    </Alert>
  </div>;
  const workspace=loaded.workspace;

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader title="Attendance" actions={(
        <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-sm font-semibold">
          {workspace.courses.length} {workspace.courses.length===1?"Course":"Courses"}
        </span>
        <span className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-sm font-semibold">
          {workspace.records.length} {workspace.records.length===1?"Session":"Sessions"}
        </span>
        <Link href="/learn/attendance/calendar"
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text transition-colors duration-[var(--lms-motion-fast)] motion-reduce:transition-none hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Monthly attendance calendar →
        </Link></div>
      )} />
      <p className="max-w-3xl text-sm text-body">See your attendance record and class-wise status in one place.</p>
      
      <LearnerAttendanceWorkspace
        defaultMonth={defaultMonth}
        courses={workspace.courses}
        summaries={workspace.summaries}
        threshold={
          workspace.policy
            .eligibilityThresholdPercent
        }
        records={workspace.records.map(
          (record) => ({
            ...record,
            startsAt:
              record.startsAt.toISOString(),
            endsAt:
              record.endsAt.toISOString(),
            markedAt:
              record.markedAt?.toISOString() ??
              null,
          }),
        )}
      />
    </div>
  );
}
