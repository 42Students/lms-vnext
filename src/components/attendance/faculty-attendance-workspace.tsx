"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  facultyAttendanceDayCell,
  groupFacultyAttendanceSessionsByIndiaDay,
  indiaAttendanceDayKey,
} from "@/modules/attendance/faculty-grid-model";

type Course = {
  deliveryId: string;
  courseName: string;
  courseCode: string;
  sectionName: string;
  sectionCode: string;
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
  description: string | null;
  startsAt: string;
  endsAt: string;
  location: string | null;
  eventStatus: string;
  attendanceStatus: string | null;
  markedAt: string | null;
  markedByUserId: string | null;
};

type RecordRow = {
  id: string;
  scheduleEventId: string;
  membershipId: string;
  status: string;
  note: string | null;
  markedAt: string;
  displayName: string | null;
  email: string | null;
  phoneE164: string | null;
  rollNumber: string | null;
};

export type FacultyAttendanceWorkspaceData = {
  course: Course;
  policy: {
    eligibilityThresholdPercent: number;
    correctionWindowHours: number;
  };
  roster: Learner[];
  sessions: Session[];
  records: RecordRow[];
};

function monthKey(value: Date) {
  return `${value.getFullYear()}-${String(
    value.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function shiftMonth(value: string, amount: number) {
  const [year, month] = value.split("-").map(Number);
  return monthKey(new Date(year!, month! - 1 + amount, 1));
}

function sameMonth(value: string, selected: string) {
  return indiaAttendanceDayKey(value).slice(0, 7) === selected;
}

function learnerName(learner: Learner) {
  return (
    learner.displayName?.trim() ||
    learner.email ||
    `Learner ${learner.membershipId.slice(0, 8)}`
  );
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sessionTime(value: Session) {
  return `${dateTime(value.startsAt)} – ${new Intl.DateTimeFormat(
    "en-IN",
    { hour: "numeric", minute: "2-digit" },
  ).format(new Date(value.endsAt))}`;
}

async function errorMessage(
  response: Response,
  fallback: string,
) {
  try {
    const body = await response.json();
    return body?.message || body?.error || fallback;
  } catch {
    return fallback;
  }
}

export function FacultyAttendanceWorkspace({
  workspace,
}: {
  workspace: FacultyAttendanceWorkspaceData;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<
    "REPORT" | "MARK"
  >("REPORT");
  const [month, setMonth] = useState(
    () => monthKey(new Date()),
  );
  const [selectedSessionId, setSelectedSessionId] =
    useState(workspace.sessions[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [absent, setAbsent] = useState<
    Set<string>
  >(new Set());
  const [submitting, setSubmitting] =
    useState(false);
  const submitLock = useRef(false);
  const [error, setError] =
    useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] =
    useState(false);
  const [scheduling, setScheduling] =
    useState(false);
  const [scheduleError, setScheduleError] =
    useState<string | null>(null);
  const [scheduleTitle, setScheduleTitle] =
    useState("");
  const [startsAt, setStartsAt] =
    useState("");
  const [endsAt, setEndsAt] =
    useState("");
  const [location, setLocation] =
    useState("");

  const recordsByKey = useMemo(
    () =>
      new Map(
        workspace.records.map((record) => [
          `${record.scheduleEventId}:${record.membershipId}`,
          record,
        ]),
      ),
    [workspace.records],
  );

  const allLearners = useMemo(() => {
    const map = new Map<string, Learner>();
    for (const learner of workspace.roster) {
      map.set(learner.membershipId, learner);
    }
    for (const record of workspace.records) {
      if (!map.has(record.membershipId)) {
        map.set(record.membershipId, {
          membershipId: record.membershipId,
          displayName: record.displayName,
          email: record.email,
          phoneE164: record.phoneE164,
          rollNumber: record.rollNumber,
        });
      }
    }
    return [...map.values()].sort((a, b) =>
      learnerName(a).localeCompare(learnerName(b)),
    );
  }, [workspace.records, workspace.roster]);

  const selectedSession =
    workspace.sessions.find(
      (session) => session.id === selectedSessionId,
    ) ?? null;

  useEffect(() => {
    if (!selectedSession) {
      setAbsent(new Set());
      return;
    }
    setAbsent(
      new Set(
        workspace.roster
          .filter((learner) =>
            Boolean(
              recordsByKey.get(
                `${selectedSession.id}:${learner.membershipId}`,
              ),
            ),
          )
          .map((learner) => learner.membershipId),
      ),
    );
  }, [
    selectedSession,
    recordsByKey,
    workspace.roster,
  ]);

  const visibleRoster = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return workspace.roster;
    return workspace.roster.filter((learner) =>
      `${learner.displayName ?? ""} ${learner.email}`
        .toLowerCase()
        .includes(term),
    );
  }, [search, workspace.roster]);

  const monthSessions = useMemo(
    () =>
      workspace.sessions.filter((session) =>
        sameMonth(session.startsAt, month),
      ),
    [workspace.sessions, month],
  );
  const monthDays = useMemo(
    () =>
      groupFacultyAttendanceSessionsByIndiaDay(
        monthSessions,
      ),
    [monthSessions],
  );

  const markedCount = monthSessions.filter(
    (session) =>
      session.attendanceStatus === "MARKED",
  ).length;

  function chooseSession(id: string) {
    setSelectedSessionId(id);
    setSearch("");
    setError(null);
  }

  function markOne(
    membershipId: string,
    isAbsent: boolean,
  ) {
    setAbsent((current) => {
      const next = new Set(current);
      if (isAbsent) next.add(membershipId);
      else next.delete(membershipId);
      return next;
    });
  }

  async function submitAttendance() {
    if (
      !selectedSession ||
      submitting ||
      submitLock.current
    ) {
      return;
    }

    setError(null);
    submitLock.current = true;
    setSubmitting(true);
    try {
      const absentMembershipIds =
        workspace.roster
          .filter((learner) =>
            absent.has(learner.membershipId),
          )
          .map((learner) => learner.membershipId);
      const presentMembershipIds =
        workspace.roster
          .filter(
            (learner) =>
              !absent.has(learner.membershipId),
          )
          .map((learner) => learner.membershipId);

      const response = await fetch(
        `/api/attendance/faculty/sessions/${encodeURIComponent(
          selectedSession.id,
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryId: workspace.course.deliveryId,
            absentMembershipIds,
            presentMembershipIds,
          }),
        },
      );
      if (!response.ok) {
        setError(
          await errorMessage(
            response,
            "Could not save attendance.",
          ),
        );
        return;
      }
      router.refresh();
    } catch {
      setError(
        "Could not save attendance. Check your connection and try again.",
      );
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  async function createSession(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (scheduling) return;

    setScheduleError(null);
    setScheduling(true);
    try {
      const startDate = new Date(startsAt);
      const endDate = new Date(endsAt);
      if (
        !Number.isFinite(startDate.getTime()) ||
        !Number.isFinite(endDate.getTime())
      ) {
        setScheduleError(
          "Choose valid start and end times.",
        );
        return;
      }
      const response = await fetch(
        "/api/attendance/faculty",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryId: workspace.course.deliveryId,
            title: scheduleTitle,
            startsAt: startDate.toISOString(),
            endsAt: endDate.toISOString(),
            location: location || null,
          }),
        },
      );
      if (!response.ok) {
        setScheduleError(
          await errorMessage(
            response,
            "Could not schedule this class.",
          ),
        );
        return;
      }
      setScheduleOpen(false);
      setScheduleTitle("");
      setStartsAt("");
      setEndsAt("");
      setLocation("");
      router.refresh();
    } catch {
      setScheduleError(
        "Could not schedule this class. Check your connection and try again.",
      );
    } finally {
      setScheduling(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
              {workspace.course.courseCode} ·{" "}
              {workspace.course.sectionName}
            </p>
            <h1 className="mt-2 text-xl font-semibold text-foreground">
              Attendance
            </h1>
            <p className="mt-1 text-sm text-body">
              {workspace.course.courseName} ·{" "}
              {workspace.course.academicPeriodName}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setScheduleOpen(true)}
          >
            Schedule Class
          </Button>
        </div>

        <div className="mt-4 inline-flex rounded-lg border border-border bg-surface-subtle p-1">
          <Button
            size="sm"
            variant={
              mode === "REPORT"
                ? "primary"
                : "ghost"
            }
            onClick={() => setMode("REPORT")}
          >
            Attendance report
          </Button>
          <Button
            size="sm"
            variant={
              mode === "MARK"
                ? "primary"
                : "ghost"
            }
            onClick={() => setMode("MARK")}
          >
            Mark attendance
          </Button>
        </div>
      </section>

      {mode === "REPORT" ? (
        <>
          <section className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="info">
                  {monthSessions.length} sessions
                </StatusBadge>
                <StatusBadge
                  tone={
                    markedCount === monthSessions.length &&
                    monthSessions.length > 0
                      ? "success"
                      : "warning"
                  }
                >
                  {markedCount} marked
                </StatusBadge>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Previous month"
                  onClick={() =>
                    setMonth((value) =>
                      shiftMonth(value, -1),
                    )
                  }
                >
                  ←
                </Button>
                <label className="text-xs font-semibold text-body">
                  Month
                  <Input
                    className="mt-1.5"
                    type="month"
                    value={month}
                    onChange={(event) =>
                      setMonth(event.target.value)
                    }
                  />
                </label>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Next month"
                  onClick={() =>
                    setMonth((value) =>
                      shiftMonth(value, 1),
                    )
                  }
                >
                  →
                </Button>
              </div>
            </div>
          </section>

          {monthSessions.length === 0 ? (
            <EmptyState
              title="No scheduled classes this month"
              description="Choose another month or schedule a class for this Course."
            />
          ) : (
            <section className="overflow-x-auto rounded-xl border border-border bg-surface p-4">
              <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="sticky left-0 z-10 bg-surface px-3 py-3">
                      Learner
                    </th>
                    {monthDays.map((day) => (
                      <th
                        key={day.dayKey}
                        className="min-w-28 px-3 py-3 text-center"
                        title={day.sessions
                          .map((session) => sessionTime(session))
                          .join(" · ")}
                      >
                        {new Intl.DateTimeFormat(
                          "en-IN",
                          {
                            timeZone: "Asia/Kolkata",
                            day: "2-digit",
                            month: "short",
                          },
                        ).format(
                          new Date(day.sessions[0]!.startsAt),
                        )}
                        {day.sessions.length > 1 ? (
                          <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                            ×{day.sessions.length}
                          </span>
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allLearners.map((learner) => (
                    <tr key={learner.membershipId}>
                      <td className="sticky left-0 z-10 bg-surface px-3 py-3">
                        <p className="m-0 font-semibold text-foreground">
                          {learnerName(learner)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[
                            learner.rollNumber
                              ? `Roll ${learner.rollNumber}`
                              : null,
                            learner.email,
                            learner.phoneE164,
                          ]
                            .filter(Boolean)
                            .join(" · ") ||
                            "Contact details unavailable"}
                        </p>
                      </td>
                      {monthDays.map((day) => {
                        const bySession = new Map(
                          day.sessions.flatMap((session) => {
                            const record = recordsByKey.get(
                              `${session.id}:${learner.membershipId}`,
                            );
                            return record
                              ? [[session.id, record] as const]
                              : [];
                          }),
                        );
                        const state = facultyAttendanceDayCell(
                          day.sessions,
                          bySession,
                        );
                        const tone =
                          state.code === "P"
                            ? "success"
                            : state.code === "A"
                              ? "error"
                              : state.code === "—"
                                ? "warning"
                                : state.code === "MIXED"
                                  ? "info"
                                  : "neutral";
                        return (
                          <td
                            key={day.dayKey}
                            aria-label={state.label}
                            className={`px-3 py-3 text-center ${state.code === "MIXED" ? "partial" : ""}`}
                          >
                            <StatusBadge tone={tone}>
                              {state.ratio ? (
                                <span className="attendance__ratio">
                                  {state.ratio}
                                </span>
                              ) : (
                                state.code
                              )}
                            </StatusBadge>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                P = Present · A = Absent · — = attendance not marked · S = future class · x/y = present sessions / all sessions that day.
              </p>
            </section>
          )}
        </>
      ) : (
        <>
          {workspace.sessions.length === 0 ? (
            <EmptyState
              title="No class sessions to mark"
              description="Schedule a class first, then return here to mark learner attendance."
            />
          ) : (
            <section className="rounded-xl border border-border bg-surface p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(16rem,24rem)_1fr]">
                <label className="text-xs font-semibold text-body">
                  Class session
                  <Select
                    className="mt-1.5"
                    value={selectedSessionId}
                    onChange={(event) =>
                      chooseSession(event.target.value)
                    }
                  >
                    {workspace.sessions.map(
                      (session) => (
                        <option
                          key={session.id}
                          value={session.id}
                        >
                          {session.title} ·{" "}
                          {dateTime(
                            session.startsAt,
                          )}
                        </option>
                      ),
                    )}
                  </Select>
                </label>
                {selectedSession ? (
                  <div className="rounded-lg bg-surface-subtle p-3 text-sm text-body">
                    <p className="m-0 font-semibold text-foreground">
                      {selectedSession.title}
                    </p>
                    <p className="mt-1">
                      {sessionTime(selectedSession)}
                      {selectedSession.location
                        ? ` · ${selectedSession.location}`
                        : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedSession.attendanceStatus ===
                      "MARKED"
                        ? "Attendance was already submitted. Saving again performs a correction."
                        : "Attendance has not been submitted for this session yet."}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Input
                  className="max-w-sm"
                  aria-label="Search learner roster"
                  placeholder="Search learner"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      workspace.roster.length === 0
                    }
                    onClick={() =>
                      setAbsent(new Set())
                    }
                  >
                    Mark all present
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      workspace.roster.length === 0
                    }
                    onClick={() =>
                      setAbsent(
                        new Set(
                          workspace.roster.map(
                            (learner) =>
                              learner.membershipId,
                          ),
                        ),
                      )
                    }
                  >
                    Mark all absent
                  </Button>
                </div>
              </div>

              <div
                className="mt-4 overflow-hidden rounded-lg border border-border"
                aria-label="Attendance roster"
              >
                {visibleRoster.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">
                    No learners match this search.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {visibleRoster.map(
                      (learner) => {
                        const isAbsent = absent.has(
                          learner.membershipId,
                        );
                        return (
                          <li
                            key={learner.membershipId}
                            className="flex flex-wrap items-center justify-between gap-3 p-4"
                          >
                            <div>
                              <p className="m-0 text-sm font-semibold text-foreground">
                                {learnerName(learner)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {[
                                  learner.rollNumber
                                    ? `Roll ${learner.rollNumber}`
                                    : null,
                                  learner.email,
                                  learner.phoneE164,
                                ]
                                  .filter(Boolean)
                                  .join(" · ") ||
                                  "Contact details unavailable"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={
                                  !isAbsent
                                    ? "primary"
                                    : "secondary"
                                }
                                aria-pressed={!isAbsent}
                                aria-label={`Mark ${learnerName(
                                  learner,
                                )} present`}
                                onClick={() =>
                                  markOne(
                                    learner.membershipId,
                                    false,
                                  )
                                }
                              >
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={
                                  isAbsent
                                    ? "danger"
                                    : "secondary"
                                }
                                aria-pressed={isAbsent}
                                aria-label={`Mark ${learnerName(
                                  learner,
                                )} absent`}
                                onClick={() =>
                                  markOne(
                                    learner.membershipId,
                                    true,
                                  )
                                }
                              >
                                Absent
                              </Button>
                            </div>
                          </li>
                        );
                      },
                    )}
                  </ul>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-subtle p-3">
                <span className="text-sm font-semibold text-body">
                  {absent.size} absent ·{" "}
                  {Math.max(
                    workspace.roster.length -
                      absent.size,
                    0,
                  )}{" "}
                  present
                </span>
                <Button
                  disabled={
                    submitting ||
                    !selectedSession ||
                    workspace.roster.length === 0
                  }
                  onClick={submitAttendance}
                >
                  {submitting
                    ? "Submitting…"
                    : "Submit Attendance"}
                </Button>
              </div>
              {error ? (
                <p
                  role="alert"
                  className="mt-3 text-sm font-semibold text-error"
                >
                  {error}
                </p>
              ) : null}
            </section>
          )}
        </>
      )}

      <Drawer
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        title="Schedule Class"
        description="Create a class session for this exact Course and Section. It will appear in learner and Faculty calendars."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={scheduling}
              onClick={() =>
                setScheduleOpen(false)
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="faculty-schedule-class-form"
              disabled={scheduling}
            >
              {scheduling
                ? "Scheduling…"
                : "Schedule Class"}
            </Button>
          </>
        }
      >
        <form
          id="faculty-schedule-class-form"
          onSubmit={createSession}
          className="space-y-4"
        >
          <label className="block text-sm font-semibold text-body">
            Class title
            <Input
              className="mt-1.5"
              value={scheduleTitle}
              onChange={(event) =>
                setScheduleTitle(
                  event.target.value,
                )
              }
              required
              maxLength={200}
              placeholder="Lecture, Lab, Tutorial…"
            />
          </label>
          <label className="block text-sm font-semibold text-body">
            Starts at
            <Input
              className="mt-1.5"
              type="datetime-local"
              value={startsAt}
              onChange={(event) =>
                setStartsAt(event.target.value)
              }
              required
            />
          </label>
          <label className="block text-sm font-semibold text-body">
            Ends at
            <Input
              className="mt-1.5"
              type="datetime-local"
              value={endsAt}
              onChange={(event) =>
                setEndsAt(event.target.value)
              }
              required
            />
          </label>
          <label className="block text-sm font-semibold text-body">
            Location
            <Input
              className="mt-1.5"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              maxLength={500}
              placeholder="Room / lab / online"
            />
          </label>
          {scheduleError ? (
            <p
              role="alert"
              className="text-sm font-semibold text-error"
            >
              {scheduleError}
            </p>
          ) : null}
        </form>
      </Drawer>
    </div>
  );
}
