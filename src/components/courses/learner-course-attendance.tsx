"use client";
import { Input } from "@/components/ui/input";

import { learnerCourseAttendanceMonthShortcutVisible } from "@/modules/attendance/learner-course-attendance-month-shortcut-model";
import { learnerCourseAttendanceSameIstMonth } from "@/modules/attendance/learner-course-attendance-ist-model";
import { useEffect, useMemo, useState, useTransition } from "react";
import { learnerAttendanceStatus } from "@/modules/attendance/model";
import {usePathname,useRouter} from "next/navigation";
import { learnerCourseAttendanceTone } from "@/modules/attendance/learner-course-attendance-tone-model";
import { learnerCourseAttendanceSummary, learnerCourseAttendanceThresholdReached } from "@/modules/attendance/learner-course-attendance-summary-model";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { DataTable } from "@/components/ui/data-table";
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

export function LearnerCourseAttendance({
  deliveryId,
  workspace,
  defaultMonth,
  currentMonth = defaultMonth,
  loadError = false,
}: {
  deliveryId: string;
  workspace: AttendanceWorkspace;
  defaultMonth: string;
  currentMonth?: string;
  /** Read failures must be supplied explicitly by the server, not inferred from zero records. */
  loadError?: boolean;
}) {
  // Search-parameter navigation must update the visible month when the
  // server sends fresh props; state initializers run only on first mount.
  const month = useMemo(() => {
    const [year, selectedMonth] = defaultMonth.split("-").map(Number);
    return new Date(year, selectedMonth - 1, 1);
  }, [defaultMonth]);

  const router=useRouter(),pathname=usePathname();
  const [isRefreshing,startRefresh]=useTransition();
  const [clientNowMs,setClientNowMs]=useState<number|null>(null);
  useEffect(()=>{
    const refreshClock=()=>setClientNowMs(Date.now());
    refreshClock();
    const timer=window.setInterval(refreshClock,60_000);
    return ()=>window.clearInterval(timer);
  },[]);
  function retryAttendance(){
    startRefresh(()=>router.refresh());
  }
  function navigateMonth(next:Date){
    const params=new URLSearchParams(window.location.search);
    params.set("month",monthKey(next));
    router.replace(pathname+"?"+params.toString());
  }

  const monthName=new Intl.DateTimeFormat("en-IN",{
    month:"long",year:"numeric",timeZone:"Asia/Kolkata",
  }).format(new Date(Date.UTC(month.getFullYear(),month.getMonth(),15,12)));
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
        .map(item => ({
          ...item,
          status: clientNowMs === null
            ? item.status
            : learnerAttendanceStatus(item,new Date(clientNowMs)),
        }))
        .sort(
          (left, right) =>
            left.startsAt.getTime() -
            right.startsAt.getTime(),
        ),
    [
      workspace.records,
      deliveryId,
      month,
      clientNowMs,
    ],
  );

  const summary = useMemo(
    () => summarize(records),
    [records],
  );

  if (loadError) {
    return <Alert tone="error" role="alert" title="Failed to load attendance.">
      <span>Attendance records could not be refreshed. No absence or presence is assumed.</span>
      <Button type="button" variant="secondary" className="mt-2 w-fit"
        disabled={isRefreshing} onClick={retryAttendance}>
        {isRefreshing ? "Retrying…" : "Retry"}
      </Button>
    </Alert>;
  }

  if (!deliveryId) {
    return <EmptyState title="Select a Course"
      description="Choose a Course to review its attendance history." />;
  }
  if (!course) {
    return (
      <EmptyState
        title="No attendance data"
        description="This Course is unavailable in your current enrollment."
      />
    );
  }

  const configuredThreshold = workspace.policy.eligibilityThresholdPercent;
  const threshold = Number.isFinite(configuredThreshold) &&
    configuredThreshold >= 0 && configuredThreshold <= 100
      ? configuredThreshold
      : 75;
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
        ? `You need ${threshold}%. You can miss ${headroom.canMiss} more ${headroom.canMiss === 1 ? "class" : "classes"} this month.`
        : `You are at or above the ${threshold}% threshold.`;
    } else if (
      headroom.recoverable &&
      headroom.mustAttend > 0
    ) {
      thresholdDetail = `Below the ${threshold}% requirement. Attend the next ${headroom.mustAttend} ${headroom.mustAttend === 1 ? "class" : "classes"} to recover.`;
    } else {
      thresholdDetail = `Below the ${threshold}% requirement. Talk to your faculty about it.`;
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="sr-only">Attendance</h2>

      <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
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

          <div className="flex w-full min-w-0 flex-wrap items-end gap-2 sm:w-auto">
            <Button size="sm" type="button" variant="secondary"
              className="min-h-11 md:min-h-9" disabled={isRefreshing}
              onClick={retryAttendance}>
              {isRefreshing ? "Refreshing…" : "Refresh attendance"}
            </Button>
            <Button
              size="sm"
              className="min-h-11 min-w-11 md:min-h-9 md:min-w-9"
              variant="secondary"
              aria-label="Previous month"
              onClick={() => navigateMonth(shiftMonth(month,-1))}
            >
              ←
            </Button>
            <label className="min-w-0 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:flex-initial">
              Month
              <Input
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
                    navigateMonth(new Date(year,monthIndex,1));
                  }
                }}
                className="mt-1.5 min-h-11 w-full md:min-h-9"
              />
            </label>
            {learnerCourseAttendanceMonthShortcutVisible(monthKey(month),currentMonth) ? (
              <Button size="sm" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
                onClick={() => {
                  const [year,nextMonth]=currentMonth.split("-").map(Number);
                  navigateMonth(new Date(year,nextMonth-1,1));
                }}>
                This month
              </Button>
            ) : null}
            <Button
              size="sm"
              className="min-h-11 min-w-11 md:min-h-9 md:min-w-9"
              variant="secondary"
              aria-label="Next month"
              onClick={() => navigateMonth(shiftMonth(month,1))}
            >
              →
            </Button>
          </div>
        </div>
      </section>

      <section aria-label="Student attendance summary"
        className={"rounded-[var(--lms-canvas-radius)] border p-4 md:p-5 "+
          (summary.percentage===null?"border-border bg-surface":
           summary.percentage>=threshold?"border-[var(--lms-success)] bg-[var(--lms-success-subtle)]":
           "border-[var(--lms-error)] bg-[var(--lms-error-subtle)]")}>
        <div className="grid grid-cols-2 gap-3">
          <div><h3 className="text-sm font-semibold text-foreground">Attendance this month</h3>
            <p className="mt-2 text-3xl font-semibold text-foreground">{summary.percentage===null?"—":summary.percentage+"%"}</p>
          </div>
          <div><h3 className="text-sm font-semibold text-foreground">Requirement</h3>
            <p className="mt-2 text-3xl font-semibold text-foreground">{threshold}%</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-body">{summary.heldSessions===0?"No classes held yet this month.":thresholdDetail}</p>
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-sm md:gap-3">
          <div><dt className="text-muted-foreground">Present</dt><dd className="font-semibold">{summary.present}</dd></div>
          <div><dt className="text-muted-foreground">Absent</dt><dd className="font-semibold">{summary.absent}</dd></div>
          <div><dt className="text-muted-foreground">Held</dt><dd className="font-semibold">{summary.heldSessions}</dd></div>
        </dl>
        {summary.unmarkedSessions>0?<Alert tone="warning" role="status" className="mt-3">{summary.unmarkedSessions} held class(es) are not marked yet and do not affect this percentage.</Alert>:null}
      </section>
      {isRefreshing?<p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden="true">◌</span> Loading attendance for {monthName}…
      </p>:null}
      <section aria-label="Attendance History" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
        <h3 className="text-lg font-semibold text-foreground">Attendance History</h3>
        <p className="mt-1 text-sm text-muted-foreground">{monthName}</p>
      </section>
      {records.length === 0 ? (
        <EmptyState
          title="No classes in this period"
        />
      ) : (
        <DataTable
          caption="Attendance History"
          rows={records}
          getRowKey={row=>row.id}
          empty={<EmptyState title="No classes in this period" />}
          mobileMode="cards"
          columns={[
            {key:"date",header:"Date",mobilePriority:"primary" as const,
              cell:(row:AttendanceRecord)=><span className="font-semibold text-foreground">
                {dateLabel(row.startsAt)}
              </span>},
            {key:"day",header:"Day",mobilePriority:"secondary" as const,
              cell:(row:AttendanceRecord)=>weekdayLabel(row.startsAt)},
            {key:"time",header:"Time",mobilePriority:"secondary" as const,
              cell:(row:AttendanceRecord)=>timeLabel(row.startsAt)},
            {key:"status",header:"Status",mobilePriority:"action" as const,
              cell:(row:AttendanceRecord)=><StatusBadge tone={learnerCourseAttendanceTone(row.status)}>
                {label(row.status)}
              </StatusBadge>},
          ]}
        />
      )}
    </div>
  );
}
