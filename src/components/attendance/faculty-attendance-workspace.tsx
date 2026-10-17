"use client";

import {
  type FormEvent,
  useEffect,
  useId,
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
import { initialAbsencesForSession, resolveFacultyAttendanceSession, facultyAttendanceMarksDirty } from "@/modules/attendance/faculty-attendance-edit-state";
import { facultyScheduleInstants } from "@/modules/attendance/faculty-schedule-editor-model";
import { facultyAttendanceConfirmation, facultyCorrectionReasonValid } from "@/modules/attendance/faculty-correction-audit-model";
import { facultyAttendanceMarkingWindow } from "@/modules/attendance/faculty-marking-window";
import { facultyLearnerAttendanceDetail, facultyAttendanceMonthSummary, facultyAttendanceThresholdBreakdown } from "@/modules/attendance/faculty-learner-attendance-detail";
import { FacultyReportDownload } from "@/components/courses/faculty-report-download";
import {
  facultyAttendanceDayCell,
  groupFacultyAttendanceSessionsByIndiaDay,
  indiaAttendanceDayKey,
  indiaAttendanceMonthKey,
  shiftIndiaAttendanceMonth,
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
  updatedAt?: string;
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
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sessionTime(value: Session) {
  return `${dateTime(value.startsAt)} – ${new Intl.DateTimeFormat(
    "en-IN",
    { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" },
  ).format(new Date(value.endsAt))}`;
}

async function errorMessage(
  response: Response,
  fallback: string,
) {
  try {
    const body = await response.json();
    if(body?.error==="ATTENDANCE_CORRECTION_NO_CHANGE")return "No learner status changed; nothing was saved.";
    if(body?.error==="ATTENDANCE_CORRECTION_REASON_REQUIRED")return "Explain the correction before saving.";
    if(body?.error==="ATTENDANCE_STALE_VERSION"){
      return "Attendance changed in another tab. Refresh the class session before correcting again.";
    }
    if (body?.error === "SCHEDULE_EVENT_CONFLICT") {
      return "Another class overlaps this time in the Section. Choose a different time.";
    }
    return body?.message || body?.error || fallback;
  } catch {
    return fallback;
  }
}

export function FacultyAttendanceWorkspace({
  workspace,
  initialSessionId,
}: {
  workspace: FacultyAttendanceWorkspaceData;
  initialSessionId?: string | null;
}) {
  const selection = resolveFacultyAttendanceSession(workspace.sessions, initialSessionId);
  const sessionSelectId = useId();
  const router = useRouter();
  const [mode, setMode] = useState<
    "REPORT" | "MARK"
  >(initialSessionId && selection === initialSessionId ? "MARK" : "REPORT");
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const [month, setMonth] = useState(
    () => indiaAttendanceMonthKey(new Date()),
  );
  const [selectedSessionId, setSelectedSessionId] =
    useState(selection);
  const [selectedDate,setSelectedDate]=useState(
    () => workspace.sessions.find(session=>session.id===selection)?
      indiaAttendanceDayKey(workspace.sessions.find(session=>session.id===selection)!.startsAt):
      indiaAttendanceDayKey(new Date()),
  );
  const [search, setSearch] = useState("");
  const [absent, setAbsent] = useState<Set<string>>(() =>
    initialAbsencesForSession(
      workspace.roster,
      workspace.records,
      selection,
    ),
  );
  const [submitting, setSubmitting] =
    useState(false);
  const submitLock = useRef(false);
  const [error, setError] =
    useState<string | null>(null);
  const [savedNotice,setSavedNotice]=useState<string|null>(null);
  const [correctionReason,setCorrectionReason]=useState("");
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
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

  const dateSessions=workspace.sessions.filter(session=>
    indiaAttendanceDayKey(session.startsAt)===selectedDate);
  function chooseDate(day:string){
    if(day===selectedDate)return;
    if(!confirmDiscardMarks())return;
    setSelectedDate(day);
    const first=workspace.sessions.find(session=>indiaAttendanceDayKey(session.startsAt)===day);
    setSelectedSessionId(first?.id??"");
    setAbsent(initialAbsencesForSession(workspace.roster,workspace.records,first?.id??""));
    setCorrectionReason("");setError(null);
  }
  const selectedSession =
    workspace.sessions.find(
      (session) => session.id === selectedSessionId,
    ) ?? null;
  const attendanceConfirmation = facultyAttendanceConfirmation(
    selectedSession?.attendanceStatus === "MARKED",
    [...initialAbsencesForSession(workspace.roster, workspace.records, selectedSessionId)],
    [...absent], workspace.roster.length,
  );
  const unsavedMarks=facultyAttendanceMarksDirty(workspace.roster,
    initialAbsencesForSession(workspace.roster,workspace.records,selectedSessionId),absent);
  useEffect(()=>{
    if(!unsavedMarks)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",warn);
    return ()=>window.removeEventListener("beforeunload",warn);
  },[unsavedMarks]);
  function confirmDiscardMarks(){
    return !unsavedMarks||window.confirm("Discard your unsaved attendance changes?");
  }
  const markingWindow = selectedSession
    ? facultyAttendanceMarkingWindow({
        startsAt: new Date(selectedSession.startsAt),
        endsAt: new Date(selectedSession.endsAt),
        correctionWindowHours: workspace.policy.correctionWindowHours,
        now: clock,
      })
    : null;

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

  const selectedLearner = selectedLearnerId
    ? allLearners.find((learner) => learner.membershipId === selectedLearnerId) ?? null
    : null;
  const learnerDetail = useMemo(
    () => selectedLearnerId
      ? facultyLearnerAttendanceDetail(selectedLearnerId, monthSessions, workspace.records, clock)
      : null,
    [selectedLearnerId, monthSessions, workspace.records, clock],
  );
  const canMarkSelectedLearner = selectedLearnerId !== null &&
    workspace.roster.some((learner) => learner.membershipId === selectedLearnerId);

  const monthSummary = useMemo(
    () => facultyAttendanceMonthSummary(
      workspace.roster.map((learner) => learner.membershipId),
      monthSessions, workspace.records, clock,
    ),
    [workspace.roster, workspace.records, monthSessions, clock],
  );
  const attendanceRisk = useMemo(
    () => facultyAttendanceThresholdBreakdown(
      monthSummary.learners, workspace.policy.eligibilityThresholdPercent,
    ),
    [monthSummary.learners, workspace.policy.eligibilityThresholdPercent],
  );

  function chooseSession(id: string) {
    if(id!==selectedSessionId&&!confirmDiscardMarks())return;
    setSavedNotice(null);
    setSelectedSessionId(id);
    setAbsent(initialAbsencesForSession(workspace.roster, workspace.records, id));
    setSearch("");
    setError(null);
    setCorrectionReason("");
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
      markingWindow !== "OPEN" ||
      submitting ||
      submitLock.current
    ) {
      return;
    }

    setError(null);
    if(selectedSession.attendanceStatus==="MARKED"&&!facultyCorrectionReasonValid(correctionReason)){
      setError("Explain this attendance correction in at least 8 characters.");return;
    }
    if (!attendanceConfirmation) {
      setError("Change at least one recorded mark before submitting a correction.");
      return;
    }
    if (!window.confirm(attendanceConfirmation)) return;
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
            ...(selectedSession.attendanceStatus==="MARKED"
              ? {expectedMarkedAt:selectedSession.markedAt,
                 correctionReason:correctionReason.trim()}:{}),
          }),
        },
      );
      if (!response.ok) {
        setError(
          "No attendance marks were saved. " + await errorMessage(
            response,
            "Retry the same roster after checking the error.",
          ),
        );
        return;
      }
      setCorrectionReason("");
      setSavedNotice("Attendance marked successfully.");
      router.refresh();
    } catch {
      setError(
        "Unable to confirm attendance save. Refresh the roster before retrying to avoid duplicate changes.",
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
      const timing = facultyScheduleInstants(startsAt, endsAt);
      if (!window.confirm("Confirm attendance session from " + startsAt.replace("T", " ") + " to " + endsAt.replace("T", " ") + " IST?")) return;
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
            ...timing,
            location: location || null,
          }),
        },
      );
      if (!response.ok) {
        setScheduleError(
          await errorMessage(
            response,
            "Failed to schedule class.",
          ),
        );
        return;
      }
      setSavedNotice("Class scheduled successfully.");
      setScheduleOpen(false);
      setScheduleTitle("");
      setStartsAt("");
      setEndsAt("");
      setLocation("");
      router.refresh();
    } catch (caught) {
      setScheduleError(caught instanceof Error ? caught.message :
        "Failed to schedule class. Check your connection and try again.");
    } finally {
      setScheduling(false);
    }
  }

  return (
    <div className="space-y-5">
      {savedNotice?<p role="status" className="rounded border border-border bg-surface p-3 text-sm text-success">{savedNotice}</p>:null}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
              {workspace.course.courseCode} ·{" "}
              {workspace.course.sectionName}
            </p>
            <h1 className="sr-only">Attendance</h1>
            <p className="mt-2 text-sm text-body">See attendance history and monthly trends in one place.</p>
            <p className="mt-1 text-xs text-muted-foreground">
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
            onClick={() => {if(confirmDiscardMarks())setMode("REPORT");}}
          >
            Monthly Attendance
          </Button>
          <Button
            size="sm"
            variant={
              mode === "MARK"
                ? "primary"
                : "ghost"
            }
            onClick={() => {if(confirmDiscardMarks())setMode("MARK");}}
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
                    monthSummary.markedSessions === monthSessions.length &&
                    monthSessions.length > 0
                      ? "success"
                      : "warning"
                  }
                >
                  {monthSummary.markedSessions} marked
                </StatusBadge>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Previous month"
                  onClick={() =>
                    setMonth((value) =>
                      shiftIndiaAttendanceMonth(value, -1),
                    )
                  }
                >
                  ←
                </Button>
                <label className="text-xs font-semibold text-body">
                  Jump to month
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
                      shiftIndiaAttendanceMonth(value, 1),
                    )
                  }
                >
                  →
                </Button>
              </div>
            </div>
          </section>

          <section aria-label="Monthly class health" className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-body">Monthly Attendance</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  See each student&apos;s attendance day by day for this month.
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {monthSummary.averagePercent === null ? "—" : monthSummary.averagePercent + "%"}
                </p>
                <p className="mt-2 max-w-xl text-xs leading-5 text-muted-foreground">
                  {monthSummary.presentMarks} present marks across {monthSummary.sessionCount} scheduled sessions.
                  {" "}{monthSummary.unmarkedSessions} session(s) not yet marked, excluded from this percentage.
                </p>
              </div>
              {monthSummary.learnerCount > 0 && monthSummary.sessionCount > 0 ? (
                <FacultyReportDownload
                  kind="attendance"
                  title={workspace.course.courseName + " " + month}
                  subtitle={workspace.course.courseCode + " · " + workspace.course.sectionName}
                  summary={[
                    "Month: " + month + " (Asia/Kolkata)",
                    "Active students: " + monthSummary.learnerCount,
                    "Sessions: " + monthSummary.sessionCount,
                    "Marked sessions: " + monthSummary.markedSessions,
                    "Unmarked sessions: " + monthSummary.unmarkedSessions,
                    "Upcoming sessions: " + monthSummary.upcomingSessions,
                    "Present marks: " + monthSummary.presentMarks,
                    "Absent marks: " + monthSummary.absentMarks,
                    "Below college guidance (" + attendanceRisk.threshold + "%): " + attendanceRisk.below.length,
                    "No marked attendance yet: " + attendanceRisk.unknown.length,
                    "Unmarked learner-session cells: " + monthSummary.unmarkedMarks,
                    "Attendance: " + (monthSummary.averagePercent === null ? "Unknown" : monthSummary.averagePercent + "%"),
                  ]}
                  sections={[{
                    title: "Active Section learner attendance",
                    rows: monthSummary.learners.map((row) => {
                      const learner = workspace.roster.find((item) => item.membershipId === row.membershipId);
                      return [
                        learner?.displayName ?? learner?.email ?? row.membershipId,
                        learner?.rollNumber ? "Roll " + learner.rollNumber : "",
                        "P " + row.present,
                        "A " + row.absent,
                        "Not marked " + row.unmarked,
                        attendanceRisk.below.includes(row.membershipId) ? "Below guidance" : "",
                        attendanceRisk.unknown.includes(row.membershipId) ? "Unknown" : "",
                        "Upcoming " + row.upcoming,
                        row.percentage === null ? "Not available" : row.percentage + "%",
                      ].filter(Boolean).join(" | ");
                    }),
                  }]}
                />
              ) : null}
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {[
                ["Students", monthSummary.learnerCount],
                ["Sessions", monthSummary.sessionCount],
                ["Absences", monthSummary.absentMarks],
                ["Not marked", monthSummary.unmarkedMarks],
                ["Active days", monthDays.filter(day=>day.sessions.length>0).length],
                ["Upcoming", monthSummary.upcomingSessions],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-surface-subtle p-3">
                  <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
            <section aria-label="Attendance threshold guidance" className="mt-5 rounded-lg border border-border bg-surface-subtle p-4">
              <h3 className="text-sm font-semibold text-foreground">
                College attendance guidance: {attendanceRisk.threshold}%
              </h3>
              <p className="mt-2 text-sm text-body">
                {attendanceRisk.below.length} below guidance · {attendanceRisk.meets} meeting guidance ·
                {" "}{attendanceRisk.unknown.length} without recorded attendance
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This monthly preview is not an official debarment or institutional eligibility decision.
              </p>
              {attendanceRisk.below.length > 0 ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {attendanceRisk.below.map((membershipId) => {
                    const learner = workspace.roster.find((row) => row.membershipId === membershipId);
                    const summary = monthSummary.learners.find((row) => row.membershipId === membershipId);
                    return (
                      <li key={membershipId} className="rounded-md border border-border bg-surface px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLearnerId(membershipId)}
                          aria-label={`Inspect monthly attendance for ${learner ? learnerName(learner) : membershipId}`}
                          className="text-left text-sm font-semibold text-primary-text hover:underline"
                        >
                          {learner ? learnerName(learner) : "Learner"} · {summary?.percentage ?? "—"}%
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>
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
                        <button
                          type="button"
                          onClick={() => setSelectedLearnerId(learner.membershipId)}
                          aria-label={`View attendance details for ${learnerName(learner)}`}
                          className="m-0 text-left font-semibold text-primary-text hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          {learnerName(learner)}
                        </button>
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
                P = Present · A = Absent · — = Not marked yet · ✖ = No class · S = future class · x/y = present sessions / all sessions that day.
              </p>
            </section>
          )}
        </>
      ) : (
        <>
          {workspace.sessions.length === 0 ? (
            <EmptyState
              title="No class scheduled for this date"
              description="Use Schedule Class to create a class session before marking attendance."
            />
          ) : (
            <section className="rounded-xl border border-border bg-surface p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(16rem,24rem)_1fr]">
                <div>
                  <label className="block text-xs font-semibold text-body">
                    Date
                    <Input type="date" className="mt-1.5" value={selectedDate}
                      onChange={event=>chooseDate(event.target.value)}/>
                  </label>
                  <label htmlFor={sessionSelectId} className="mt-3 block text-xs font-semibold text-body">
                    Class session
                  </label>
                  <Select
                    id={sessionSelectId}
                    className="mt-1.5"
                    value={selectedSessionId}
                    onChange={(event) =>
                      chooseSession(event.target.value)
                    }
                  >
                    {!dateSessions.length?<option value="">No classes scheduled</option>:null}
                    {dateSessions.map(
                      (session) => (
                        <option
                          key={session.id}
                          value={session.id}
                        >
                          {session.title} ·{" "}
                          {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",timeStyle:"short"})
                            .format(new Date(session.startsAt))} IST
                        </option>
                      ),
                    )}
                  </Select>
                  {!dateSessions.length?<p role="status" className="mt-2 text-sm text-muted-foreground">
                    No class scheduled for this date. Use Schedule Class to add one.
                  </p>:null}
                </div>
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
                    {markingWindow !== "OPEN" ? (
                      <p role="status" className="mt-2 text-xs font-semibold text-warning">
                        {markingWindow === "NOT_STARTED"
                          ? "Cannot mark attendance for a class that has not started yet"
                          : `Attendance window has closed. Attendance can only be marked within ${workspace.policy.correctionWindowHours} hours after the class ends.`}
                      </p>
                    ) : null}
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
                  aria-label="Find a student by name"
                  placeholder="Find a student by name"
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

              {selectedSession?.attendanceStatus==="MARKED"?(
                <label className="mt-4 block space-y-2 text-sm font-semibold text-body">
                  Correction explanation (required)
                  <textarea value={correctionReason} maxLength={500} rows={3}
                    className="w-full rounded-md border border-border bg-background p-3 text-sm font-normal"
                    placeholder="What changed in the recorded attendance?"
                    onChange={event=>setCorrectionReason(event.target.value)}/>
                  <span className="block text-xs font-normal text-muted-foreground">
                    This explanation is retained in the activity audit without learner names.
                  </span>
                </label>
              ):null}
              {selectedSession?.attendanceStatus === "MARKED" ? (
                <p role="status" className="mt-3 text-xs text-muted-foreground">
                  {attendanceConfirmation ?? "No recorded marks have changed. Choose a changed mark to correct attendance."}
                </p>
              ) : null}
              <div className="sticky bottom-0 z-20 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm sm:static sm:border-0 sm:bg-surface-subtle sm:shadow-none">
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
                    markingWindow !== "OPEN" ||
                    workspace.roster.length === 0 ||
                    !attendanceConfirmation ||
                    (selectedSession?.attendanceStatus==="MARKED"&&!facultyCorrectionReasonValid(correctionReason))
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

      {selectedLearner ? (
      <Drawer
        open={true}
        onOpenChange={(open) => { if (!open) setSelectedLearnerId(null); }}
        title={selectedLearner ? learnerName(selectedLearner) + " attendance" : "Learner attendance"}
        description={`Recorded class sessions for ${month}. Unmarked and upcoming sessions are not included in the attendance percentage.`}
      >
        {selectedLearner && learnerDetail ? (
          <div className="space-y-5">
            <p className="text-sm text-body">
              {[selectedLearner.rollNumber ? "Roll " + selectedLearner.rollNumber : null,
                selectedLearner.email, selectedLearner.phoneE164].filter(Boolean).join(" · ") ||
                "Contact details unavailable"}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Present", learnerDetail.present],
                ["Absent", learnerDetail.absent],
                ["Not marked", learnerDetail.unmarked],
                ["Upcoming", learnerDetail.upcoming],
                ["Marked", learnerDetail.marked],
                ["Attendance", learnerDetail.attendedPercent === null ? "—" : learnerDetail.attendedPercent + "%"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-surface-subtle p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <h3 className="text-base font-semibold text-foreground">Session history</h3>
            {learnerDetail.rows.length === 0 ? (
              <p className="text-sm text-body">No class sessions are scheduled for this month.</p>
            ) : (
              <ol className="space-y-3">
                {learnerDetail.rows.map((session) => {
                  const canMark = canMarkSelectedLearner &&
                    facultyAttendanceMarkingWindow({
                      startsAt: new Date(session.startsAt),
                      endsAt: new Date(session.endsAt),
                      correctionWindowHours: workspace.policy.correctionWindowHours,
                      now: clock,
                    }) === "OPEN";
                  return (
                    <li key={session.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm text-foreground">{session.title}</strong>
                        <StatusBadge tone={session.code === "P" ? "success" : session.code === "A" ? "error" : session.code === "—" ? "warning" : "neutral"}>
                          {session.label}
                        </StatusBadge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{dateTime(session.startsAt)}</p>
                      {session.note ? <p className="mt-2 whitespace-pre-wrap text-sm text-body">{session.note}</p> : null}
                      {session.markedAt ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Last recorded {dateTime(session.markedAt)}
                        </p>
                      ) : null}
                      {canMark ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            chooseSession(session.id);
                            setMode("MARK");
                            setSelectedLearnerId(null);
                          }}
                        >
                          {session.code === "—" ? "Mark this session" : "Review / correct session"}
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="text-xs text-muted-foreground">
              Corrections after the Faculty window closes require a College Admin.
              Historical records are not editable from this detail panel.
            </p>
          </div>
        ) : null}
      </Drawer>
      ) : null}

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
            Starts at (IST)
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
            Ends at (IST)
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
