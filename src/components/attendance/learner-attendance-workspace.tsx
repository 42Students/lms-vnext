"use client";

import { Disclosure } from "@/components/ui/disclosure";
import Link from "next/link";
import {learnerAttendanceDateLabel as dateLabel, learnerAttendanceTimeLabel as timeLabel} from "@/modules/attendance/learner-attendance-display-date-model";
import {learnerAttendanceUrlRecoveryNotice} from "@/modules/attendance/learner-attendance-url-recovery-model";
import {monthKey,parseMonth,shiftMonth} from "@/modules/attendance/learner-attendance-month-navigation-model";

import {
  useMemo,
  useTransition,
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
import {Input} from "@/components/ui/input";

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



/** Only a persisted explicit PRESENT mark counts as present. Legacy nullable
 * absence IDs and unmarked/late/medical/excused states must not be guessed
 * into attendance on a historical migration. */
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
    <section className="min-w-0 border-b border-border py-3">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-[20px]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-body leading-[20px]">
        {detail}
      </p>
      {history?.length?<Disclosure title={label === "Absent" ? "Absent Dates" : `Recent dates (${history.length})`} className="mt-2">
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
  const [isUpdating,startTransition] = useTransition();
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
  const reached = learnerAttendanceThresholdReached(summary.present,summary.markedSessions,threshold);
  const headroom = reached && threshold > 0
    ? Math.max(0,Math.floor((summary.present * 100 / threshold) - summary.markedSessions))
    : 0;
  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month:"long",year:"numeric",timeZone:"Asia/Kolkata",
  }).format(month);

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
    startTransition(() => {
      router.replace(
        `/learn/attendance?${next.toString()}`,
        { scroll: false },
      );
    });
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
    startTransition(() => {router.replace(`/learn/attendance?${next.toString()}`,{scroll:false});});
  }

  function changeHistoryOrder(nextOrder:LearnerAttendanceOrder) {
    const next=new URLSearchParams();
    if(deliveryId)next.set("deliveryId",deliveryId);
    next.set("month",filters.month);
    if(historyFilter!=="ALL")next.set("status",historyFilter);
    if(nextOrder!=="NEWEST")next.set("order",nextOrder);
    startTransition(() => {router.replace(`/learn/attendance?${next.toString()}`,{scroll:false});});
  }

  // The parent server route only renders the workspace after a successful
  // authorized fetch. Network/permission errors use its attendance error
  // boundary with Retry, and must never masquerade as zero enrollments.
  if (courses.length === 0) {
    return (
      <EmptyState
        title="No Courses to track yet"
        description="Attendance will appear once you are placed in an active Section with Course deliveries."
      />
    );
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      {urlNotice ? <p role="status" className="rounded-[var(--lms-control-radius)] border border-warning bg-warning-subtle p-3 text-sm text-body leading-[22px]">{urlNotice}</p> : null}
      {isUpdating ? <p role="status" aria-live="polite" className="border-b border-border py-2 text-sm text-body">
        Updating attendance for {new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(month)}…
      </p> : null}
      <section className="min-w-0 border-b border-border pb-4 pt-4 md:pb-6 md:pt-6">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
          <label className="w-full max-w-sm font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Course
            <Select
              className="mt-[6px]"
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
                  {item.courseName} · {item.sectionName} ({item.courseCode})
                </option>
              ))}
            </Select>
          </label>

          <div className="flex min-w-0 flex-wrap items-end gap-2">
            <Button className="max-md:min-h-11"
              size="sm"
              variant="secondary"
              aria-label="Previous month"
              onClick={() =>
                changeMonth(
                  shiftMonth(month, -1),
                )
              }
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </Button>
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
              <span className="sr-only">Jump to month</span>
              <Input
                aria-label="Jump to month"
                type="month"
                className="mt-[6px] w-40"
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
              <Button className="max-md:min-h-11" size="sm" variant="secondary"
                onClick={() => changeMonth(parseMonth(defaultMonth))}>
                This month
              </Button>
            ) : null}
            <Button className="max-md:min-h-11"
              size="sm"
              variant="secondary"
              aria-label="Next month"
              onClick={() =>
                changeMonth(
                  shiftMonth(month, 1),
                )
              }
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </Button>
          </div>
        </div>

        {course ? (
          <div className="mt-3 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="text-xs text-muted-foreground leading-[20px]">
              {course.sectionName} ·{" "}{course.academicPeriodName}
            </p>
            {learnerAttendanceCourseHistoryHref(course.deliveryId,filters.month) ? (
              <Link href={learnerAttendanceCourseHistoryHref(course.deliveryId,filters.month)!}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-primary-text hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                Full course attendance history →
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>

      <section aria-label="Student attendance summary" className="learn-attendance-summary rounded-[var(--lms-radius-card)] border border-border bg-surface px-4 py-4 md:px-6">
        <span className="text-sm font-semibold text-body">Attendance this month</span>
        <strong className="mt-2 block text-3xl font-semibold tabular-nums text-foreground">{summary.markedSessions ? summary.percentage + "%" : "—"}</strong>
        <p className="mt-2 max-w-2xl text-sm text-body">
          {!summary.markedSessions ? "No classes held yet in this period."
            : reached ? `You need ${threshold}%. You can miss ${headroom} more ${headroom === 1 ? "class" : "classes"} this month.`
            : recovery !== null && Number.isFinite(recovery)
              ? `Below the ${threshold}% requirement. Attend the next ${recovery} ${recovery === 1 ? "class" : "classes"} to recover.`
              : `Below the ${threshold}% requirement. Talk to your faculty about it.`}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3 text-center" aria-label="Attendance counts">
          <span className="text-xs text-muted-foreground"><strong className="block text-xl font-semibold tabular-nums text-foreground">{summary.present}</strong>Present</span>
          <span className="text-xs text-muted-foreground"><strong className="block text-xl font-semibold tabular-nums text-foreground">{summary.absent}</strong>Absent</span>
          <span className="text-xs text-muted-foreground"><strong className="block text-xl font-semibold tabular-nums text-foreground">{summary.heldSessions}</strong>Held</span>
        </div>
      </section>
      <div className="flex min-w-0 flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Attendance History</h2>
          <p className="mt-1 text-xs text-muted-foreground leading-[20px]">Review each scheduled class and your status for it.</p>
          <p className="mt-1 text-xs text-muted-foreground leading-[20px]">{monthLabel} · Status filters affect only the session list, not attendance totals.</p>
        </div>
        <div className="grid min-w-0 w-full gap-3 sm:grid-cols-2 md:w-auto">
        <label className="min-w-0 w-full font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Order
          <Select className="mt-[6px] min-h-11 md:min-h-9 w-full" value={historyOrder}
            onChange={event=>changeHistoryOrder(event.target.value as LearnerAttendanceOrder)}>
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
          </Select>
        </label>
        <label className="min-w-0 w-full font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Show
          <Select className="mt-[6px] min-h-11 md:min-h-9 w-full" value={historyFilter}
            onChange={event => changeHistoryFilter(event.target.value as LearnerAttendanceHistoryFilter)}>
            {LEARNER_ATTENDANCE_HISTORY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </label>
        {(historyFilter !== "ALL" || historyOrder !== "NEWEST") ? (
          <Button className="max-md:min-h-11" variant="secondary" type="button" onClick={() => startTransition(() => {router.replace(learnerAttendanceHistoryResetHref(deliveryId,filters.month),{scroll:false});})}
            >
            Reset history filters
          </Button>
        ) : null}
        </div>
      </div>
      {historyRows.length > 0 ? (
        <div className="flex min-w-0 flex-col items-start gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{attendanceCsv.truncated ? "CSV includes the first 200 matching sessions; narrow the selection for remaining records." : "CSV includes the matching sessions shown for this month."}</span>
          <a download="learner-attendance-history.csv"
            href={"data:text/csv;charset=utf-8,"+encodeURIComponent(attendanceCsv.content)}
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Download attendance CSV
          </a>
        </div>
      ) : null}
      {historyRows.length === 0 ? (
        <EmptyState
          title={monthRows.length ? "No sessions match this status" : deliveryId ? "No classes in this period" : "Select a course"}
          description={monthRows.length ? "Select All statuses to see the recorded sessions for this month." : deliveryId ? "No classes in this period. Try selecting a different month." : "Choose a course from the dropdown above to view your attendance records."}
        />
      ) : (
        <DataTable
          caption="Attendance history"
          mobileMode="cards"
          rows={historyRows}
          getRowKey={row=>row.id}
          empty={<EmptyState title="No classes in this period" description="Select another month to see scheduled sessions."/>}
          columns={[
            {key:"date",header:"Date",mobilePriority:"primary" as const,
              cell:(row)=><strong className="block text-foreground">{new Intl.DateTimeFormat("en-IN",{
                timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric",
              }).format(new Date(row.startsAt))}</strong>},
            {key:"day",header:"Day",mobilePriority:"secondary" as const,
              cell:(row)=><span className="text-foreground">{new Intl.DateTimeFormat("en-IN",{
                timeZone:"Asia/Kolkata",weekday:"long",
              }).format(new Date(row.startsAt))}</span>},
            {key:"class",header:"Class Start Time",mobilePriority:"secondary" as const,
              cell:(row)=><span className="block min-w-0">
                <strong className="block text-foreground">{timeLabel(row.startsAt)}</strong>
                <span className="block break-words text-xs text-muted-foreground">{row.title} · {row.courseCode}</span>
              </span>},
            {key:"status",header:"Present/Absent",mobilePriority:"secondary" as const,
              cell:(row)=><StatusBadge tone={learnerAttendanceStatusTone(row.status)}>{statusLabel(row.status)}</StatusBadge>},
            {key:"details",header:"Faculty / location",mobilePriority:"secondary" as const,
              cell:(row)=>[row.courseName,row.facultyName,row.location].filter(Boolean).join(" · ")||"Not specified"},
          ]}
        />
      )}

      <Disclosure title="Attendance details" className="border-b border-border" contentClassName="space-y-4 py-3">
      <Disclosure title="Attendance" className="border-b border-border" contentClassName="pb-4">
      <div className="grid min-w-0 gap-x-4 gap-y-2 md:grid-cols-2 xl:grid-cols-5">
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
      </Disclosure>

      <section className="min-w-0 border-b border-border pb-4 pt-4 md:pb-6 md:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">
              Eligibility signal
            </h2>
            <p className="mt-1 text-xs text-body leading-[20px]">
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
        <p className="max-w-prose border-l-2 border-border bg-surface-subtle py-3 pl-4 pr-2 text-sm text-body leading-[22px]" role="note">
          {recovery === Infinity
            ? "At a 100% threshold, prior non-present marks cannot be offset by future attendance alone."
            : recovery === 0
              ? "Your recorded attendance is currently at or above the threshold."
              : `If your next ${recovery} marked sessions are all present, your recorded percentage can reach the threshold. This is a mathematical estimate, not an eligibility guarantee.`}
        </p>
      ) : null}

      <section className="min-w-0 border-b border-border pb-4 pt-4 md:pb-6 md:pt-6">
        <Disclosure title="Course overview" contentClassName="pb-4">
        <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((item) => (
            <Button className="min-h-11 w-full flex-col items-start text-left md:min-h-9" variant="secondary"
              key={item.deliveryId}
              type="button"
              onClick={() =>
                changeCourse(
                  item.deliveryId,
                )
              }
              
            >
              <span className="block max-w-full break-words text-sm font-semibold text-foreground">
                {item.courseName}
              </span>
              <span className="mt-1 block max-w-full break-words text-xs text-muted-foreground">
                {item.courseCode} ·{" "}
                {item.sectionName}
              </span>
              <span className="mt-2 flex max-w-full flex-wrap gap-2">
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
              </span>
            </Button>
          ))}
        </div>
        </Disclosure>
      </section>
      </Disclosure>
    </div>
  );
}
