import Link from "next/link";
import {learnerAttendanceIstMonth,learnerAttendanceMonthSchema} from "@/modules/attendance/learner-attendance-filter-model";
import {learnerAttendanceMonthWindow} from "@/modules/attendance/learner-attendance-calendar-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerAttendanceWorkspace,
} from "@/components/attendance/learner-attendance-workspace";
import { PageHeader } from "@/components/ui/page-header";
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
  const workspace =
    await getLearnerAttendanceWorkspace(
      context,
      {window:learnerAttendanceMonthWindow(selected)},
    );

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Attendance" actions={(
        <Link href="/learn/attendance/calendar"
          className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text transition-colors duration-[var(--lms-motion-fast)] hover:border-primary hover:bg-primary-subtle hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none">
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
