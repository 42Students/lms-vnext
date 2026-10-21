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

export default async function LearnerAttendancePage({searchParams}:{
  searchParams:Promise<{month?:string|string[]}>;
}) {
  const raw=await searchParams;
  const defaultMonth=learnerAttendanceIstMonth(new Date());
  const selected=learnerAttendanceMonthSchema.safeParse(raw.month).data??defaultMonth;
  const context =
    await getCurrentRequestContext();
  // Keep the requested IST month on a failed read; no records are fabricated.
  const loaded=await getLearnerAttendanceWorkspace(context,{
    window:learnerAttendanceMonthWindow(selected),
  }).then(workspace=>({ok:true as const,workspace}))
    .catch(()=>({ok:false as const}));
  if(!loaded.ok)return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Attendance"/>
    <Alert tone="error">
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
        <Link href="/learn/attendance/calendar"
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text transition-colors duration-[var(--lms-motion-fast)] motion-reduce:transition-none hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Monthly attendance calendar →
        </Link>
      )} />
      
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
