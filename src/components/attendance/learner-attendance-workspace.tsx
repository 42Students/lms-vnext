"use client";

import {
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";

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

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function parseMonth(value: string | null) {
  if (
    value &&
    /^\d{4}-\d{2}$/.test(value)
  ) {
    const [year, month] = value
      .split("-")
      .map(Number);
    if (
      year &&
      month &&
      month >= 1 &&
      month <= 12
    ) {
      return new Date(year, month - 1, 1);
    }
  }
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );
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

function sameMonth(
  value: string,
  month: Date,
) {
  const date = new Date(value);
  return (
    date.getFullYear() ===
      month.getFullYear() &&
    date.getMonth() === month.getMonth()
  );
}

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
  const absent = marked.length - present;

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

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusTone(
  status: RecordRow["status"],
) {
  if (status === "PRESENT") {
    return "success" as const;
  }
  if (status === "NOT_MARKED") {
    return "warning" as const;
  }
  if (status === "SCHEDULED") {
    return "neutral" as const;
  }
  return "error" as const;
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
}: {
  label: string;
  value: string | number;
  detail: string;
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
    </section>
  );
}

export function LearnerAttendanceWorkspace({
  courses,
  records,
  summaries,
  threshold,
}: {
  courses: readonly Course[];
  records: readonly RecordRow[];
  summaries: readonly Summary[];
  threshold: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const initialDeliveryId =
    params.get("deliveryId") &&
    courses.some(
      (course) =>
        course.deliveryId ===
        params.get("deliveryId"),
    )
      ? params.get("deliveryId")!
      : courses[0]?.deliveryId ?? "";
  const [deliveryId, setDeliveryId] =
    useState(initialDeliveryId);
  const [month, setMonth] = useState(() =>
    parseMonth(params.get("month")),
  );

  const course =
    courses.find(
      (item) =>
        item.deliveryId === deliveryId,
    ) ?? null;

  const monthRows = useMemo(
    () =>
      records.filter(
        (row) =>
          row.deliveryId === deliveryId &&
          sameMonth(row.startsAt, month),
      ),
    [records, deliveryId, month],
  );
  const summary = useMemo(
    () => summarize(monthRows),
    [monthRows],
  );

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
    router.replace(
      `/learn/attendance?${next.toString()}`,
      { scroll: false },
    );
  }

  function changeCourse(
    nextDeliveryId: string,
  ) {
    setDeliveryId(nextDeliveryId);
    updateUrl(nextDeliveryId, month);
  }

  function changeMonth(nextMonth: Date) {
    setMonth(nextMonth);
    updateUrl(deliveryId, nextMonth);
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
                  {item.courseName} ·{" "}
                  {item.courseCode}
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
              Month
              <input
                type="month"
                className="mt-1.5 min-h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
                value={monthKey(month)}
                onChange={(event) =>
                  changeMonth(
                    parseMonth(
                      event.target.value,
                    ),
                  )
                }
              />
            </label>
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
          <p className="mt-3 text-xs text-muted-foreground">
            {course.sectionName} ·{" "}
            {course.academicPeriodName}
          </p>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Held"
          value={summary.heldSessions}
          detail="Classes that have already started this month."
        />
        <Metric
          label="Present"
          value={summary.present}
          detail="Marked sessions where you are present."
        />
        <Metric
          label="Absent"
          value={summary.absent}
          detail="Absent, excused, medical or late records."
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
                : summary.percentage >=
                    threshold
                  ? "success"
                  : "error"
            }
          >
            {summary.percentage === null
              ? "No marked sessions"
              : summary.percentage >=
                  threshold
                ? "At or above threshold"
                : "Below threshold"}
          </StatusBadge>
        </div>
      </section>

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

      {monthRows.length === 0 ? (
        <EmptyState
          title="No attendance records"
          description="No held classes are linked to this Course for the selected month. Try another period."
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
                {monthRows.map((row) => (
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
                    <td className="px-4 py-3">
                      <p className="m-0 font-semibold text-foreground">
                        {row.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.courseCode}
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
                        tone={statusTone(
                          row.status,
                        )}
                      >
                        {statusLabel(
                          row.status,
                        )}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {monthRows.map((row) => (
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
                    tone={statusTone(
                      row.status,
                    )}
                  >
                    {statusLabel(
                      row.status,
                    )}
                  </StatusBadge>
                </div>
                <p className="mt-3 text-xs text-body">
                  {[
                    row.courseName,
                    row.facultyName,
                    row.location,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
