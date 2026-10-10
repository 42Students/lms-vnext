"use client";

import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";

type DeliveryOption = {
  deliveryId: string;
  sectionId: string;
  sectionName: string;
  sectionCode: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  academicPeriodId: string;
  academicPeriodName: string;
};

type Learner = {
  membershipId: string;
  displayName: string | null;
  email: string | null;
  phoneE164: string | null;
  rollNumber: string | null;
};

type Session = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  attendanceStatus: string | null;
  attendanceMarkedAt: string | null;
  attendanceMarkedByUserId: string | null;
  attendanceMarkedByName: string | null;
};

type RecordRow = {
  id: string;
  scheduleEventId: string;
  membershipId: string;
  status: string;
  note: string | null;
  markedByUserId: string;
  markedByName: string | null;
  markedAt: string;
};

export type AdminAttendanceWorkspaceData = {
  collegeId: string;
  collegeName: string;
  policy: {
    eligibilityThresholdPercent: number;
    correctionWindowHours: number;
  };
  deliveries: DeliveryOption[];
  selectedDeliveryId: string | null;
  month: string;
  grid: null | {
    delivery: DeliveryOption;
    roster: Learner[];
    sessions: Session[];
    records: RecordRow[];
  };
};

type CellTarget = {
  learner: Learner;
  session: Session;
  record: RecordRow | undefined;
};

function learnerName(learner: Learner) {
  return (
    learner.displayName?.trim() ||
    learner.email?.trim() ||
    `Learner ${learner.membershipId.slice(0, 8)}`
  );
}

function codeFor(
  session: Session,
  record: RecordRow | undefined,
) {
  if (
    new Date(session.startsAt).getTime() >
    Date.now()
  ) {
    return {
      code: "S",
      label: "Scheduled",
      tone: "neutral" as const,
      counted: false,
      present: false,
    };
  }
  const counted =
    session.attendanceStatus === "MARKED" ||
    Boolean(record);
  if (!counted) {
    return {
      code: "—",
      label: "Not marked",
      tone: "warning" as const,
      counted: false,
      present: false,
    };
  }
  if (!record) {
    return {
      code: "P",
      label: "Present",
      tone: "success" as const,
      counted: true,
      present: true,
    };
  }
  const mapping: Record<
    string,
    { code: string; label: string }
  > = {
    PRESENT: {
      code: "P",
      label: "Present",
    },
    ABSENT: { code: "A", label: "Absent" },
    EXCUSED: {
      code: "E",
      label: "Excused",
    },
    MEDICAL: {
      code: "M",
      label: "Medical",
    },
    LATE: { code: "L", label: "Late" },
  };
  const value = mapping[record.status] ?? {
    code: "?",
    label: record.status,
  };
  return {
    ...value,
    tone:
      record.status === "PRESENT"
        ? ("success" as const)
        : ("error" as const),
    counted: true,
    present: record.status === "PRESENT",
  };
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminAttendanceWorkspace({
  data,
  basePath,
}: {
  data: AdminAttendanceWorkspaceData;
  basePath: string;
}) {
  const router = useRouter();
  const [target, setTarget] =
    useState<CellTarget | null>(null);
  const [correcting, setCorrecting] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const recordMap = useMemo(
    () =>
      new Map(
        (data.grid?.records ?? []).map(
          (record) => [
            `${record.scheduleEventId}:${record.membershipId}`,
            record,
          ],
        ),
      ),
    [data.grid?.records],
  );

  const heldSessions = useMemo(
    () =>
      (data.grid?.sessions ?? []).filter(
        (session) =>
          new Date(
            session.startsAt,
          ).getTime() <= Date.now(),
      ),
    [data.grid?.sessions],
  );

  function learnerPercent(learner: Learner) {
    let counted = 0;
    let present = 0;
    for (const session of heldSessions) {
      const state = codeFor(
        session,
        recordMap.get(
          `${session.id}:${learner.membershipId}`,
        ),
      );
      if (!state.counted) continue;
      counted += 1;
      if (state.present) present += 1;
    }
    return counted === 0
      ? null
      : Math.round(
          (present / counted) * 100,
        );
  }

  async function correct(
    status:
      | "PRESENT"
      | "ABSENT"
      | "EXCUSED"
      | "MEDICAL"
      | "LATE",
  ) {
    if (
      !target ||
      !data.selectedDeliveryId ||
      correcting
    ) {
      return;
    }
    setError(null);
    setCorrecting(true);
    try {
      const response = await fetch(
        `/api/attendance/admin/sessions/${encodeURIComponent(
          target.session.id,
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            collegeId: data.collegeId,
            deliveryId:
              data.selectedDeliveryId,
            membershipId:
              target.learner.membershipId,
            status,
          }),
        },
      );
      if (!response.ok) {
        const body = await response
          .json()
          .catch(() => null);
        setError(
          body?.message ||
            body?.error ||
            "Attendance correction failed.",
        );
        return;
      }
      setTarget(null);
      router.refresh();
    } catch {
      setError(
        "Attendance correction failed. Check your connection and retry.",
      );
    } finally {
      setCorrecting(false);
    }
  }

  function exportCsv() {
    if (!data.grid) return;
    const header = [
      "Learner",
      "Roll",
      ...data.grid.sessions.map(
        (session) =>
          new Date(session.startsAt)
            .toISOString()
            .slice(0, 10),
      ),
      "Attendance %",
    ];
    const rows = data.grid.roster.map(
      (learner) => [
        learnerName(learner),
        learner.rollNumber ?? "",
        ...data.grid!.sessions.map(
          (session) =>
            codeFor(
              session,
              recordMap.get(
                `${session.id}:${learner.membershipId}`,
              ),
            ).label,
        ),
        learnerPercent(learner) ?? "",
      ],
    );
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replaceAll(
                '"',
                '""',
              )}"`,
          )
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${data.grid.delivery.sectionCode}-${data.grid.delivery.courseCode}-${data.month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Retroactive marking window
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {data.policy.correctionWindowHours} hours
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Read-only policy. Admin corrections are oversight actions and are not blocked by the Faculty window.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Minimum attendance
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {data.policy.eligibilityThresholdPercent}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Learners below this marked-session percentage are highlighted.
          </p>
        </div>
      </section>

      <form
        action={basePath}
        className="grid gap-3 rounded-xl border border-border bg-surface p-4 lg:grid-cols-[1fr_12rem_auto]"
      >
        <label className="text-xs font-semibold text-body">
          Class and Course
          <Select
            className="mt-1.5"
            name="deliveryId"
            defaultValue={
              data.selectedDeliveryId ?? ""
            }
          >
            <option value="">
              Select class and course
            </option>
            {data.deliveries.map(
              (delivery) => (
                <option
                  key={delivery.deliveryId}
                  value={delivery.deliveryId}
                >
                  {delivery.sectionName} ·{" "}
                  {delivery.courseCode} ·{" "}
                  {delivery.courseName}
                </option>
              ),
            )}
          </Select>
        </label>
        <label className="text-xs font-semibold text-body">
          Month
          <Input
            className="mt-1.5"
            type="month"
            name="month"
            defaultValue={data.month}
          />
        </label>
        <button
          type="submit"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          View attendance
        </button>
      </form>

      {!data.grid ? (
        <EmptyState
          title="Select a class and course"
          description="Choose an exact Course delivery and month to review marked, unmarked and future attendance."
        />
      ) : data.grid.sessions.length === 0 ? (
        <EmptyState
          title="No attendance data for this month"
          description="No class sessions are scheduled for the selected Course delivery in this month."
        />
      ) : (
        <>
          <section className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                  Monthly class health
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  {data.grid.delivery.sectionName} ·{" "}
                  {data.grid.delivery.courseName}
                </h2>
                <p className="mt-1 text-sm text-body">
                  {
                    data.grid.sessions.filter(
                      (session) =>
                        session.attendanceStatus ===
                        "MARKED",
                    ).length
                  }{" "}
                  of {heldSessions.length} held sessions marked
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={exportCsv}
              >
                Export CSV
              </Button>
            </div>
          </section>

          <section className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
              <thead className="bg-surface-subtle text-xs uppercase tracking-[0.06em] text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-20 bg-surface-subtle px-4 py-3">
                    Learner
                  </th>
                  {data.grid.sessions.map(
                    (session) => (
                      <th
                        key={session.id}
                        className="min-w-24 px-3 py-3 text-center"
                        title={formatDateTime(
                          session.startsAt,
                        )}
                      >
                        {new Intl.DateTimeFormat(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                          },
                        ).format(
                          new Date(
                            session.startsAt,
                          ),
                        )}
                      </th>
                    ),
                  )}
                  <th className="px-4 py-3 text-center">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.grid.roster.map(
                  (learner) => {
                    const percent =
                      learnerPercent(learner);
                    return (
                      <tr
                        key={
                          learner.membershipId
                        }
                      >
                        <td className="sticky left-0 z-10 bg-surface px-4 py-3">
                          <p className="m-0 font-semibold text-foreground">
                            {learnerName(
                              learner,
                            )}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {learner.rollNumber
                              ? `Roll ${learner.rollNumber}`
                              : learner.email ??
                                "Roll unavailable"}
                          </p>
                        </td>
                        {data.grid.sessions.map(
                          (session) => {
                            const record =
                              recordMap.get(
                                `${session.id}:${learner.membershipId}`,
                              );
                            const state =
                              codeFor(
                                session,
                                record,
                              );
                            const correctable =
                              new Date(
                                session.startsAt,
                              ).getTime() <=
                              Date.now();
                            return (
                              <td
                                key={
                                  session.id
                                }
                                className="px-3 py-3 text-center"
                              >
                                <button
                                  type="button"
                                  disabled={
                                    !correctable
                                  }
                                  aria-label={`${state.label} — ${learnerName(
                                    learner,
                                  )} — ${formatDateTime(
                                    session.startsAt,
                                  )}`}
                                  onClick={() =>
                                    setTarget({
                                      learner,
                                      session,
                                      record,
                                    })
                                  }
                                  className="disabled:cursor-default"
                                >
                                  <StatusBadge
                                    tone={
                                      state.tone
                                    }
                                  >
                                    {
                                      state.code
                                    }
                                  </StatusBadge>
                                </button>
                              </td>
                            );
                          },
                        )}
                        <td className="px-4 py-3 text-center">
                          {percent === null ? (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          ) : (
                            <StatusBadge
                              tone={
                                percent <
                                data.policy
                                  .eligibilityThresholdPercent
                                  ? "error"
                                  : percent <
                                      data
                                        .policy
                                        .eligibilityThresholdPercent +
                                        10
                                    ? "warning"
                                    : "success"
                              }
                            >
                              {percent}%
                            </StatusBadge>
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </section>

          <p className="text-xs leading-5 text-muted-foreground">
            P = Present · A = Absent · E = Excused · M = Medical · L = Late · — = not marked · S = future session. Select a held-session cell to inspect and correct it.
          </p>
        </>
      )}

      <Drawer
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open && !correcting) {
            setTarget(null);
            setError(null);
          }
        }}
        title={
          target
            ? `Attendance — ${learnerName(
                target.learner,
              )}`
            : "Attendance"
        }
        description={
          target
            ? `${target.session.title} · ${formatDateTime(
                target.session.startsAt,
              )}`
            : undefined
        }
        footer={
          target ? (
            <div className="flex w-full flex-wrap justify-end gap-2">
              {(
                [
                  "PRESENT",
                  "ABSENT",
                  "EXCUSED",
                  "MEDICAL",
                  "LATE",
                ] as const
              ).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={
                    status === "PRESENT"
                      ? "primary"
                      : status === "ABSENT"
                        ? "danger"
                        : "secondary"
                  }
                  disabled={correcting}
                  onClick={() =>
                    void correct(status)
                  }
                >
                  {correcting
                    ? "Saving…"
                    : status.charAt(0) +
                      status
                        .slice(1)
                        .toLowerCase()}
                </Button>
              ))}
            </div>
          ) : null
        }
      >
        {target ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-surface-subtle p-4">
              <p className="font-semibold text-foreground">
                Current status
              </p>
              <p className="mt-1 text-body">
                {
                  codeFor(
                    target.session,
                    target.record,
                  ).label
                }
              </p>
            </div>
            <dl className="grid gap-3">
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                  Marked by
                </dt>
                <dd className="mt-1 text-foreground">
                  {target.record
                    ?.markedByName ||
                    target.session
                      .attendanceMarkedByName ||
                    "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                  Marked at
                </dt>
                <dd className="mt-1 text-foreground">
                  {formatDateTime(
                    target.record
                      ?.markedAt ??
                      target.session
                        .attendanceMarkedAt,
                  )}
                </dd>
              </div>
            </dl>
            {error ? (
              <p
                role="alert"
                className="font-semibold text-error"
              >
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
