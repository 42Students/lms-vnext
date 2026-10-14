import Link from "next/link";
import { learnerAttendanceIstMonth } from "@/modules/attendance/learner-attendance-filter-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerAttendanceWorkspace,
} from "@/components/attendance/learner-attendance-workspace";
import { PageHeader } from "@/components/ui/page-header";
import {
  getLearnerAttendanceWorkspace,
} from "@/modules/attendance/learner-service";

export default async function LearnerAttendancePage() {
  const context =
    await getCurrentRequestContext();
  const workspace =
    await getLearnerAttendanceWorkspace(
      context,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner"
        title="Attendance"
        description="Your marked attendance, unmarked sessions and College threshold across active Courses."
      />
      <div className="flex flex-wrap justify-end gap-3">
        <Link href="/learn/attendance/calendar"
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline">
          Monthly attendance calendar →
        </Link>
      </div>
      <LearnerAttendanceWorkspace
        defaultMonth={learnerAttendanceIstMonth(new Date())}
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
