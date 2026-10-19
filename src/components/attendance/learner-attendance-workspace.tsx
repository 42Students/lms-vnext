import { StatTile } from "@/components/ui/stat-tile";
"use client";

import { Disclosure } from "@/components/ui/disclosure";
import Link from "next/link";
import {learnerAttendanceDateLabel as dateLabel, learnerAttendanceTimeLabel as timeLabel} from "@/modules/attendance/learner-attendance-display-date-model";
import {learnerAttendanceUrlRecoveryNotice} from "@/modules/attendance/learner-attendance-url-recovery-model";
import {monthKey,parseMonth,shiftMonth} from "@/modules/attendance/learner-attendance-month-navigation-model";

import {
  useMemo,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { filterLearnerAttendanceMonth, resolveLearnerAttendanceFilters } from "@/modules/attendance/learner-attendance-filter-model";
import { learnerAttendanceHistoryFilterSchema, filterLearnerAttendanceHistory, LEARNER_ATTENDANCE_HISTORY_OPTIONS, type LearnerAttendanceHistoryFilter } from "@/modules/attendance/learner-attendance-history-model";
import { learnerAttendanceCourseHistoryHref } from "@/modules/attendance/learner-attendance-history-link-model";
import { learnerAttendanceHistoryCsv } from "@/modules/attendance/learner-attendance-history-csv-model";
import { learnerAttendanceRecoveryProjection } from "@/modules/attendance/learner-attendance-recovery-model";
import { learnerAttendanceThresholdReached } from "@/modules/attendance/learner-attendance-threshold-model";
import { learnerAttendanceCanReturnToMonth } from "@/modules/attendance/learner-attendance-today-month-model";
import { learnerAttendanceHistoryResetHref } from "@/modules/attendance/learner-attendance-history-reset-model";
import { learnerAttendanceStatusTone } from "@/modules/attendance/learner-attendance-status-tone-model";
import { learnerAttendanceExactAbsences } from "@/modules/attendance/learner-attendance-exact-absence-model";
import { learnerAttendanceOrderSchema, sortLearnerAttendanceHistory, type LearnerAttendanceOrder } from "@/modules/attendance/learner-attendance-history-order-model";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";

type Course = {
  deliveryId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  sectionName: string;
  academicPeriodName: string;
};

type RecordRow = {
  id: string;
  deliveryId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  sectionName: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  facultyName: string | null;
  markedAt: string | null;
  status:
    | "PRESENT"
    | "ABSENT"
    | "EXCUSED"
    | "MEDICAL"
    | "LATE"
    | "NOT_MARKED"
    | "SCHEDULED";
};

type Summary = {
  deliveryId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  sectionName: string;
  academicPeriodName: string;
  heldSessions: number;
  markedSessions: number;
  unmarkedSessions: number;
  present: number;
  absent: number;
  percentage: number | null;
};



function isPresent(
  status: RecordRow["status"],
) {
  return status === "PRESENT";
}

function summarize(
  rows: readonly RecordRow[],
) {
  const held = rows.filter(
    (row) => row.status !== "SCHEDULED",
  );
  const marked = held.filter(
    (row) => row.status !== "NOT_MARKED",
  );
  const present = marked.filter(
    (row) => isPresent(row.status),
  ).length;
  const absent = learnerAttendanceExactAbsences(marked);

  return {
    heldSessions: held.length,
    markedSessions: marked.length,
    unmarkedSessions:
      held.length - marked.length,
    present,
    absent,
    percentage:
      marked.length > 0
        ? Math.round(
            (present / marked.length) *
              100,
          )
        : null,
  };
}


function statusLabel(
  status: RecordRow["status"],
) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (value) =>
      value.toUpperCase(),
    );
}

function Metric({
  label,
  value,
  detail,
  history,
}: {
  label: string;
  value: string | number;
  detail: string;
  history?:readonly {at:string;label:string}[];
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-body">
        {detail}
      </p>
      {history?.length?<Disclosure title={`Recent dates (${history.length})`} className="mt-2">
        <ol className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-body">
          {history.map(item=><li key={item.at+":"+item.label}><time dateTime={item.at}>{item.label}</time></li>)}
        </ol>
      </Disclosure>:null}
    </section>
  );
}

export function LearnerAttendanceWorkspace({
  courses,
  records,
  summaries,
  threshold,
  defaultMonth,
}: {
  courses: readonly Course[];
  records: readonly RecordRow[];
  summaries: readonly Summary[];
  threshold: number;
  defaultMonth: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const filters = resolveLearnerAttendanceFilters({
    deliveryId: params.get("deliveryId"), month: params.get("month"),
  }, courses, defaultMonth);
  const deliveryId = filters.deliveryId;
  const month = parseMonth(filters.month);
  const urlNotice=learnerAttendanceUrlRecoveryNotice({
    deliveryId:params.get("deliveryId"),month:params.get("month"),
    status:params.get("status"),order:params.get("order"),
  },courses);
  const historyFilter = learnerAttendanceHistoryFilterSchema.catch("ALL").parse(params.get("status") ?? "ALL");
  const historyOrder=learnerAttendanceOrderSchema.catch("NEWEST").parse(params.get("order")??"NEWEST");

  const course =
    courses.find(
      (item) =>
        item.deliveryId === deliveryId,
    ) ?? null;

  const monthRows = useMemo(
    () => filterLearnerAttendanceMonth(records, deliveryId, filters.month),
    [records, deliveryId, filters.month],
  );
  const summary = useMemo(
    () => summarize(monthRows),
    [monthRows],
  );
  const historyRows = useMemo(
    () => sortLearnerAttendanceHistory(filterLearnerAttendanceHistory(monthRows,historyFilter),historyOrder),
    [monthRows,historyFilter,historyOrder],
  );
  const attendanceCsv = useMemo(() => learnerAttendanceHistoryCsv(historyRows), [historyRows]);
  const recentStatusDates=(status:RecordRow["status"])=>monthRows
    .filter(row=>row.status===status)
    .sort((a,b)=>Date.parse(b.startsAt)-Date.parse(a.startsAt))
    .slice(0,10).map(row=>({
      at:row.startsAt,
      label:new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(row.startsAt)),
    }));

  const recovery = learnerAttendanceRecoveryProjection(summary.markedSessions,summary.present,threshold);

  function updateUrl(
    nextDeliveryId: string,
    nextMonth: Date,
  ) {
    const next = new URLSearchParams();
    if (nextDeliveryId) {
      next.set(
        "deliveryId",
        nextDeliveryId,
      );
    }
    next.set("month", monthKey(nextMonth));
    if (historyFilter !== "ALL") next.set("status", historyFilter);
    if (historyOrder !== "NEWEST") next.set("order",historyOrder);
    router.replace(
      `/learn/attendance?${next.toString()}`,
      { scroll: false },
    );
  }

  function changeCourse(
    nextDeliveryId: string,
  ) {
    updateUrl(nextDeliveryId, month);
  }

  function changeMonth(nextMonth: Date) {
    updateUrl(deliveryId, nextMonth);
  }
  function changeHistoryFilter(nextFilter: LearnerAttendanceHistoryFilter) {
    const next = new URLSearchParams();
    if (deliveryId) next.set("deliveryId",deliveryId);
    next.set("month",filters.month);
    if (nextFilter !== "ALL") next.set("status",nextFilter);
    if (historyOrder !== "NEWEST") next.set("order",historyOrder);
    router.replace(`/learn/attendance?${next.toString()}`,{scroll:false});
  }

  function changeHistoryOrder(nextOrder:LearnerAttendanceOrder) {
    const next=new URLSearchParams();
    if(deliveryId)next.set("deliveryId",deliveryId);
    next.set("month",filters.month);
    if(historyFilter!=="ALL")next.set("status",historyFilter);
    if(nextOrder!=="NEWEST")next.set("order",nextOrder);
    router.replace(`/learn/attendance?${next.toString()}`,{scroll:false});
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        title="No Courses to track yet"
        description="Attendance will appear once you are placed in an active Section with Course deliveries."
      />
    );
  }

  return (
    <div className="space-y-5">
      {urlNotice ? <p role="status" className="rounded-[var(--lms-control-radius)] border border-warning bg-warning-subtle p-3 text-sm text-body">{urlNotice}</p> : null}
      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label className="w-full max-w-sm text-xs font-semibold text-body">
            Course
            <Select
              className="mt-1.5"
              value={deliveryId}
              onChange={(event) =>
                changeCourse(
                  event.target.value,
                )
              }
            >
              {courses.map((item) => (
                <option
                  key={item.deliveryId}
                  value={item.deliveryId}
                >
                  {item.courseName}
                </option>
              ))}
            </Select>
          </label>

          <div className="flex flex-wrap items-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              aria-label="Previous month"
              onClick={() =>
                changeMonth(
                  shiftMonth(month, -1),
                )
              }
            >
              ←
            </Button>
            <label className="text-xs font-semibold text-body">
              Jump to month
              <input
                type="month"
                className="mt-1.5 min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
                value={monthKey(month)}
                onChange={(event) =>
                  changeMonth(
                    parseMonth(
                      event.target.value || filters.month,
                    ),
                  )
                }
              />
            </label>
            {learnerAttendanceCanReturnToMonth(filters.month,defaultMonth) ? (
              <Button size="sm" variant="secondary"
                onClick={() => changeMonth(parseMonth(defaultMonth))}>
                This month
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              aria-label="Next month"
              onClick={() =>
                changeMonth(
                  shiftMonth(month, 1),
                )
              }
            >
              →
            </Button>
          </div>
        </div>

        {course ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {course.sectionName} ·{" "}{course.academicPeriodName}
            </p>
            {learnerAttendanceCourseHistoryHref(course.deliveryId,filters.month) ? (
              <Link href={learnerAttendanceCourseHistoryHref(course.deliveryId,filters.month)!}
                className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
                Full course attendance history →
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total" value={monthRows.length}
          detail="All scheduled and held classes in the selected month."/>
        <Metric
          label="Held"
          value={summary.heldSessions}
          detail="Classes that have already started this month."
        />
        <Metric
          label="Present"
          value={summary.present}
          detail="Marked sessions where you are present."
          history={recentStatusDates("PRESENT")}
        />
        <Metric
          label="Absent"
          value={summary.absent}
          detail="Only explicitly absent records. Excused, medical and late sessions keep their distinct statuses."
          history={recentStatusDates("ABSENT")}
        />
        <Metric
          label="Attendance"
          value={
            summary.percentage === null
              ? "—"
              : `${summary.percentage}%`
          }
          detail={
            summary.unmarkedSessions > 0
              ? `${summary.unmarkedSessions} session(s) are not marked yet and do not affect the percentage.`
              : "Only marked sessions affect the percentage."
          }
        />
      </div>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-sm font-semibold text-foreground">
              Eligibility signal
            </h2>
            <p className="mt-1 text-xs leading-5 text-body">
              Your College attendance threshold is{" "}
              <strong>{threshold}%</strong>.
              This is an informational attendance signal;
              any formal exam-eligibility rule remains
              College policy.
            </p>
          </div>
          <StatusBadge
            tone={
              summary.percentage === null
                ? "neutral"
                : learnerAttendanceThresholdReached(summary.present,summary.markedSessions,threshold)
                  ? "success"
                  : "error"
            }
          >
            {summary.percentage === null
              ? "No marked sessions"
              : learnerAttendanceThresholdReached(summary.present,summary.markedSessions,threshold)
                ? "At or above threshold"
                : "Below threshold"}
          </StatusBadge>
        </div>
      </section>

      {recovery !== null ? (
        <p className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4 text-sm leading-6 text-body" role="note">
          {recovery === Infinity
            ? "At a 100% threshold, prior non-present marks cannot be offset by future attendance alone."
            : recovery === 0
              ? "Your recorded attendance is currently at or above the threshold."
              : `If your next ${recovery} marked sessions are all present, your recorded percentage can reach the threshold. This is a mathematical estimate, not an eligibility guarantee.`}
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="m-0 text-sm font-semibold text-foreground">
          Course overview
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((item) => (
            <button
              key={item.deliveryId}
              type="button"
              onClick={() =>
                changeCourse(
                  item.deliveryId,
                )
              }
              className="rounded-lg border border-border bg-surface-subtle p-4 text-left outline-none transition hover:border-primary focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            >
              <p className="m-0 text-sm font-semibold text-foreground">
                {item.courseName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.courseCode} ·{" "}
                {item.sectionName}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge
                  tone={
                    item.percentage === null
                      ? "neutral"
                      : item.percentage >=
                          threshold
                        ? "success"
                        : "error"
                  }
                >
                  {item.percentage === null
                    ? "No marked attendance"
                    : `${item.percentage}%`}
                </StatusBadge>
                {item.unmarkedSessions > 0 ? (
                  <StatusBadge tone="warning">
                    {item.unmarkedSessions}{" "}
                    unmarked
                  </StatusBadge>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Session history</h2>
          <p className="mt-1 text-xs text-muted-foreground">Status filters affect only the session list, not attendance totals.</p>
        </div>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
        <label className="w-full min-w-44 flex-1 text-xs font-semibold text-body">Order
          <Select className="mt-1.5 min-h-11 sm:min-h-9 w-full" value={historyOrder}
            onChange={event=>changeHistoryOrder(event.target.value as LearnerAttendanceOrder)}>
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
          </Select>
        </label>
        <label className="w-full min-w-44 flex-1 text-xs font-semibold text-body">Show
          <Select className="mt-1.5 min-h-11 sm:min-h-9 w-full" value={historyFilter}
            onChange={event => changeHistoryFilter(event.target.value as LearnerAttendanceHistoryFilter)}>
            {LEARNER_ATTENDANCE_HISTORY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </label>
        {(historyFilter !== "ALL" || historyOrder !== "NEWEST") ? (
          <button type="button" onClick={() => router.replace(learnerAttendanceHistoryResetHref(deliveryId,filters.month),{scroll:false})}
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text">
            Reset history filters
          </button>
        ) : null}
        </div>
      </div>
      {historyRows.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{attendanceCsv.truncated ? "CSV includes the first 200 matching sessions; narrow the selection for remaining records." : "CSV includes the matching sessions shown for this month."}</span>
          <a download="learner-attendance-history.csv"
            href={"data:text/csv;charset=utf-8,"+encodeURIComponent(attendanceCsv.content)}
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text">
            Download attendance CSV
          </a>
        </div>
      ) : null}
      {historyRows.length === 0 ? (
        <EmptyState
          title={monthRows.length ? "No sessions match this status" : deliveryId ? "No attendance records" : "Select a course"}
          description={monthRows.length ? "Select All statuses to see the recorded sessions for this month." : deliveryId ? "No classes scheduled for this month. Try selecting a different period." : "Choose a course from the dropdown above to view your attendance records."}
        />
      ) : (
        <DataTable
          caption="Attendance history"
          rows={historyRows}
          getRowKey={row=>row.id}
          empty={<EmptyState title="No attendance records" description="No classes scheduled for this month. Try selecting a different period."/>}
          columns={[
            {key:"date",header:"Date",mobilePriority:"primary" as const,
              cell:(row)=><span className="block min-w-0">
                <strong className="block text-foreground">{dateLabel(row.startsAt)}</strong>
                <span className="block text-xs text-muted-foreground">{timeLabel(row.startsAt)}</span>
              </span>},
            {key:"class",header:"Class Start Time",mobilePriority:"secondary" as const,
              cell:(row)=><span className="block min-w-0">
                <strong className="block text-foreground">{timeLabel(row.startsAt)}</strong>
                <span className="block break-words text-xs text-muted-foreground">{row.title} · {row.courseCode}</span>
              </span>},
            {key:"status",header:"Status",mobilePriority:"secondary" as const,
              cell:(row)=><StatusBadge tone={learnerAttendanceStatusTone(row.status)}>{statusLabel(row.status)}</StatusBadge>},
            {key:"details",header:"Faculty / location",mobilePriority:"secondary" as const,
              cell:(row)=>[row.courseName,row.facultyName,row.location].filter(Boolean).join(" · ")||"Not specified"},
            {key:"day",header:"Day",mobilePriority:"secondary" as const,
              cell:(row)=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"long"}).format(new Date(row.startsAt))},
          ]}
        />
      )}
    </div>
  );
}
