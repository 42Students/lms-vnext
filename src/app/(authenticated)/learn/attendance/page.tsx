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
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
      />
      <div className="flex flex-wrap justify-end gap-3">
        <Link href="/learn/attendance/calendar"
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline">
          Monthly attendance calendar →
        </Link>
      </div>
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
