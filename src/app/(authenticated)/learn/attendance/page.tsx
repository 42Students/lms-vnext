import { Suspense } from "react";
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
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
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

import { zUuid } from "@/lib/schema-primitives";
type AttendanceParams={month?:string|string[];deliveryId?:string|string[]};
function AttendanceLoading() {
 return <div className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading attendance">
  <PageHeader title="Attendance"/>
  <div aria-hidden="true" className="flex flex-wrap gap-2"><SkeletonBlock className="h-8 w-24" /><SkeletonBlock className="h-8 w-32" /></div>
  <div role="presentation" aria-hidden="true" className="overflow-x-auto rounded-lg border border-border">
   <div className="min-w-[500px] space-y-3 p-4">
    {[1,2,3,4,5].map(key=><div key={key} className="grid grid-cols-5 gap-3">
      {[1,2,3,4,5].map(cell=><SkeletonBlock key={cell} className="h-7" />)}
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
  const deliveryId=typeof raw.deliveryId==="string"?raw.deliveryId:undefined;
  if(raw.deliveryId!==undefined&&(!deliveryId||!zUuid.safeParse(deliveryId).success)){
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Attendance" />
      <ErrorState title="Invalid course attendance link"
        description="Select a course from your own attendance list; a repeated or malformed course selector was not used."
        action={<TextLink href="/learn/attendance"
          className="inline-flex min-h-11 items-center md:min-h-9">View my attendance</TextLink>} />
    </div>;
  }
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
      <TextLink href={"/learn/attendance?"+new URLSearchParams({month:selected,...(deliveryId?{deliveryId}:{})}).toString()}>
        Retry attendance
      </TextLink>
    </Alert>
  </div>;
  const workspace=loaded.workspace;

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader title="Attendance" description="See your attendance record and class-wise status in one place." actions={(
        <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-sm font-semibold">
          {workspace.courses.length} {workspace.courses.length===1?"Course":"Courses"}
        </span>
        <span className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-sm font-semibold">
          {workspace.records.length} {workspace.records.length===1?"Session":"Sessions"}
        </span>
        <ButtonLink variant="secondary" href={"/learn/attendance/calendar?"+new URLSearchParams({month:selected,...(deliveryId?{deliveryId}:{})}).toString()}>
          Monthly attendance calendar →
        </ButtonLink></div>
      )} />
      {raw.month!==undefined&&!learnerAttendanceMonthSchema.safeParse(raw.month).success ? <Alert tone="warning" role="status">
        The requested month filter was invalid. Showing the current month instead.
        <TextLink href="/learn/attendance" className="ml-2">Clear month filter</TextLink>
      </Alert> : null}
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
