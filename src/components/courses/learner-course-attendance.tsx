"use client";

import { learnerCourseAttendanceMonthShortcutVisible } from "@/modules/attendance/learner-course-attendance-month-shortcut-model";
import { learnerCourseAttendanceSameIstMonth } from "@/modules/attendance/learner-course-attendance-ist-model";
import { useMemo, useState } from "react";
import { learnerCourseAttendanceTone } from "@/modules/attendance/learner-course-attendance-tone-model";
import { learnerCourseAttendanceSummary, learnerCourseAttendanceThresholdReached } from "@/modules/attendance/learner-course-attendance-summary-model";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { getLearnerAttendanceWorkspace } from "@/modules/attendance/learner-service";

type AttendanceWorkspace = Awaited<
  ReturnType<typeof getLearnerAttendanceWorkspace>
>;

type AttendanceRecord =
  AttendanceWorkspace["records"][number];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function shiftMonth(
  date: Date,
  amount: number,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1,
  );
}

function sameMonth(value: Date, month: Date) {
  return learnerCourseAttendanceSameIstMonth(value,monthKey(month));
}

function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function weekdayLabel(value:Date){
 return new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(value);
}
function timeLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function label(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (value) =>
      value.toUpperCase(),
    );
}

function summarize(rows: readonly AttendanceRecord[]) {
  return learnerCourseAttendanceSummary(rows);
}

function attendanceHeadroom(
  present: number,
  held: number,
  thresholdPercent: number,
) {
  const threshold = thresholdPercent / 100;

  if (
    !Number.isFinite(threshold) ||
    threshold <= 0
  ) {
    return {
      canMiss: Number.POSITIVE_INFINITY,
      mustAttend: 0,
      recoverable: true,
    };
  }

  const canMiss = Math.max(
    0,
    Math.floor(
      present / threshold -
        held +
        1e-9,
    ),
  );

  if (
    held === 0 ||
    present / held >= threshold
  ) {
    return {
      canMiss,
      mustAttend: 0,
      recoverable: true,
    };
  }

  if (threshold >= 1) {
    return {
      canMiss: 0,
      mustAttend: 0,
      recoverable: false,
    };
  }

  return {
    canMiss: 0,
    mustAttend: Math.max(
      1,
      Math.ceil(
        (threshold * held - present) /
          (1 - threshold) -
          1e-9,
      ),
    ),
    recoverable: true,
  };
}

function Metric({
  label: metricLabel,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {metricLabel}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-body">
        {detail}
      </p>
    </section>
  );
}

export function LearnerCourseAttendance({
  deliveryId,
  workspace,
  defaultMonth,
}: {
  deliveryId: string;
  workspace: AttendanceWorkspace;
  defaultMonth: string;
}) {
  const [month, setMonth] = useState(
    () => {
      const [year,month]=defaultMonth.split("-").map(Number);
      return new Date(year,month-1,1);
    },
  );

  const course = workspace.courses.find(
    (item) =>
      item.deliveryId === deliveryId,
  );

  const records = useMemo(
    () =>
      workspace.records
        .filter(
          (item) =>
            item.deliveryId ===
              deliveryId &&
            sameMonth(
              item.startsAt,
              month,
            ),
        )
        .sort(
          (left, right) =>
            left.startsAt.getTime() -
            right.startsAt.getTime(),
        ),
    [
      workspace.records,
      deliveryId,
      month,
    ],
  );

  const summary = useMemo(
    () => summarize(records),
    [records],
  );

  if (!course) {
    return (
      <EmptyState
        title="No attendance data"
        description="Attendance is unavailable for this Course."
      />
    );
  }

  const threshold =
    workspace.policy
      .eligibilityThresholdPercent;
  const headroom = attendanceHeadroom(
    summary.present,
    summary.markedSessions,
    threshold,
  );

  let thresholdDetail =
    "No marked attendance in this period.";
  if (summary.markedSessions > 0) {
    if (
      summary.percentage !== null &&
      learnerCourseAttendanceThresholdReached(summary.present,summary.markedSessions,threshold)
    ) {
      thresholdDetail = Number.isFinite(
        headroom.canMiss,
      )
        ? `You need ${threshold}%. You can miss ${headroom.canMiss} more ${headroom.canMiss === 1 ? "class" : "classes"} and remain at or above the current threshold.`
        : `You are at or above the ${threshold}% threshold.`;
    } else if (
      headroom.recoverable &&
      headroom.mustAttend > 0
    ) {
      thresholdDetail = `Below the ${threshold}% threshold. Attend the next ${headroom.mustAttend} ${headroom.mustAttend === 1 ? "class" : "classes"} to recover.`;
    } else {
      thresholdDetail = `Below the ${threshold}% threshold. Talk to your Faculty or College team about the applicable policy.`;
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="sr-only">
          Attendance
        </h2>
        <p className="m-0 text-sm text-body">
          See your attendance record and class-wise status in one place.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {course.courseCode}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {course.courseName} ·{" "}
              {course.sectionName}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              aria-label="Previous month"
              onClick={() =>
                setMonth((current) =>
                  shiftMonth(current, -1),
                )
              }
            >
              ←
            </Button>
            <label className="text-xs font-semibold text-body">
              Month
              <input
                type="month"
                aria-label="Jump to month"
                value={monthKey(month)}
                onChange={(event) => {
                  const [
                    yearText,
                    monthText,
                  ] =
                    event.target.value.split(
                      "-",
                    );
                  const year =
                    Number(yearText);
                  const monthIndex =
                    Number(monthText) - 1;
                  if (
                    Number.isInteger(year) &&
                    Number.isInteger(
                      monthIndex,
                    ) &&
                    monthIndex >= 0 &&
                    monthIndex <= 11
                  ) {
                    setMonth(
                      new Date(
                        year,
                        monthIndex,
                        1,
                      ),
                    );
                  }
                }}
                className="mt-1.5 min-h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
              />
            </label>
            {learnerCourseAttendanceMonthShortcutVisible(monthKey(month),defaultMonth) ? (
              <Button size="sm" variant="secondary"
                onClick={() => {
                  const [year,nextMonth]=defaultMonth.split("-").map(Number);
                  setMonth(new Date(year,nextMonth-1,1));
                }}>
                This month
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              aria-label="Next month"
              onClick={() =>
                setMonth((current) =>
                  shiftMonth(current, 1),
                )
              }
            >
              →
            </Button>
          </div>
        </div>
      </section>

      <section aria-label="Attendance this month" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-foreground">Attendance this month</h3>
        <p className="mt-2 text-3xl font-semibold text-foreground">{summary.percentage===null?"—":summary.percentage+"%"}</p>
        <p className="mt-2 text-sm text-body">{summary.heldSessions===0?"No classes held yet in this period.":thresholdDetail}</p>
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3 text-sm">
          <div><dt className="text-muted-foreground">Present</dt><dd className="font-semibold">{summary.present}</dd></div>
          <div><dt className="text-muted-foreground">Absent</dt><dd className="font-semibold">{summary.absent}</dd></div>
          <div><dt className="text-muted-foreground">Held</dt><dd className="font-semibold">{summary.heldSessions}</dd></div>
        </dl>
        {summary.unmarkedSessions>0?<p className="mt-3 text-xs text-muted-foreground">{summary.unmarkedSessions} held class(es) are not marked yet and do not affect this percentage.</p>:null}
      </section>
      <section aria-label="Attendance History" className="space-y-1">
        <h3 className="font-semibold">Attendance History</h3>
        <p className="text-sm text-muted-foreground">Review each scheduled class and your status for it.</p>
      </section>
      {records.length === 0 ? (
        <EmptyState
          title="No classes in this period"
          description="Try selecting a different month."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-subtle text-xs uppercase tracking-[0.06em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">
                    Date
                  </th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">
                    Class
                  </th>
                  <th className="px-4 py-3">
                    Faculty / location
                  </th>
                  <th className="px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-3">
                      <p className="m-0 font-semibold text-foreground">
                        {dateLabel(
                          row.startsAt,
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {timeLabel(
                          row.startsAt,
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-body">{weekdayLabel(row.startsAt)}</td>
                  <td className="px-4 py-3">
                      <p className="m-0 font-semibold text-foreground">
                        {row.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {course.courseCode} ·{" "}
                        {course.sectionName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-body">
                      {[
                        row.facultyName,
                        row.location,
                      ]
                        .filter(Boolean)
                        .join(" · ") ||
                        "Not specified"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={learnerCourseAttendanceTone(
                          row.status,
                        )}
                      >
                        {label(row.status)}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {records.map((row) => (
              <article
                key={row.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="m-0 text-sm font-semibold text-foreground">
                      {row.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dateLabel(
                        row.startsAt,
                      )}{" "}
                      ·{" "}
                      {timeLabel(
                        row.startsAt,
                      )}
                    </p>
                  </div>
                  <StatusBadge
                    tone={learnerCourseAttendanceTone(
                      row.status,
                    )}
                  >
                    {label(row.status)}
                  </StatusBadge>
                </div>
                <p className="mt-3 text-xs text-body">
                  {[
                    row.facultyName,
                    row.location,
                  ]
                    .filter(Boolean)
                    .join(" · ") ||
                    "Faculty / location not specified"}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
