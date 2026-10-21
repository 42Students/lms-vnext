"use client";
import { SummaryStrip } from "@/components/ui/summary-strip";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  type FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import {SegmentedControl} from "@/components/ui/segmented-control";

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
    learner.displayName?.trim() || "Name not recorded"
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
    // UX-teacher-attendanceDetail-07: never render unrecognized API errors or internals.
    return fallback;
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
  const [confirmingAttendance, setConfirmingAttendance] = useState(false);
  const [confirmingRosterReload, setConfirmingRosterReload] = useState(false);
  const [discardOpen,setDiscardOpen]=useState(false);
  const nextAfterDiscard=useRef<(()=>void)|null>(null);
  const submitLock = useRef(false);
  const scheduleLock=useRef(false);
  const [error, setError] =
    useState<string | null>(null);
  const [savedNotice,setSavedNotice]=useState<string|null>(null);
  useEffect(() => {
    if (!savedNotice) return;
    const timeout = window.setTimeout(() => setSavedNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [savedNotice]);
  const [correctionReason,setCorrectionReason]=useState("");
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] =
    useState(false);
  const [scheduling, setScheduling] =
    useState(false);
  const [confirmScheduleOpen,setConfirmScheduleOpen]=useState(false);
  const [confirmScheduleDiscardOpen,setConfirmScheduleDiscardOpen]=useState(false);
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
  const scheduleDirty = Boolean(scheduleTitle.trim() || startsAt || endsAt || location.trim());

  function closeScheduleDrawer() {
    if (scheduling || scheduleLock.current) {
      setScheduleError("Wait for the class schedule to finish saving.");
      return;
    }
    if (scheduleDirty) {
      setConfirmScheduleDiscardOpen(true);
      return;
    }
    setScheduleOpen(false);
  }

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
    confirmDiscardMarks(()=>{
      setSelectedDate(day);
      const first=workspace.sessions.find(session=>indiaAttendanceDayKey(session.startsAt)===day);
      setSelectedSessionId(first?.id??"");
      setAbsent(initialAbsencesForSession(workspace.roster,workspace.records,first?.id??""));
      setCorrectionReason("");setError(null);
    });
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
    if(!unsavedMarks && !(scheduleOpen && scheduleDirty))return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",warn);
    return ()=>window.removeEventListener("beforeunload",warn);
  },[unsavedMarks,scheduleOpen,scheduleDirty]);
  function confirmDiscardMarks(next:()=>void){
    if(!unsavedMarks){next();return;}
    nextAfterDiscard.current=next;setDiscardOpen(true);
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
      (learner.displayName ?? "").normalize("NFKC").toLocaleLowerCase("en-IN")
        .includes(term.normalize("NFKC").toLocaleLowerCase("en-IN")),
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
  // Legacy monthly view includes no-class dates, not only scheduled days.
  const calendarDays = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) return [];
    const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const sessionsByDay = new Map(monthDays.map((day) => [day.dayKey, day.sessions] as const));
    return Array.from({ length: count }, (_, index) => {
      const dayKey = month + "-" + String(index + 1).padStart(2, "0");
      return { dayKey, sessions: sessionsByDay.get(dayKey) ?? [] };
    });
  }, [month, monthDays]);
  // A future class is scheduled, not a class that has been held.
  const heldMonthSessions = monthSessions.filter((session) =>
    new Date(session.endsAt).getTime() <= clock.getTime() &&
    session.eventStatus !== "CANCELLED",
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
    if(id===selectedSessionId)return;
    confirmDiscardMarks(()=>{
      setSavedNotice(null);
      setSelectedSessionId(id);
      setAbsent(initialAbsencesForSession(workspace.roster,workspace.records,id));
      setSearch("");setError(null);setCorrectionReason("");
    });
  }
  function markOne(
    membershipId: string,
    isAbsent: boolean,
  ) {
    if (markingWindow !== "OPEN" || submitting || submitLock.current) return;
    setAbsent((current) => {
      const next = new Set(current);
      if (isAbsent) next.add(membershipId);
      else next.delete(membershipId);
      return next;
    });
  }

  function requestAttendanceConfirmation() {
    if (!selectedSession) { setError("Please select a class."); return; }
    if (markingWindow !== "OPEN" || submitting || submitLock.current) return;
    setError(null);
    if (selectedSession.attendanceStatus === "MARKED" && !facultyCorrectionReasonValid(correctionReason)) {
      setError("Explain this attendance correction in at least 8 characters."); return;
    }
    if (!attendanceConfirmation) {
      setError(selectedSession.attendanceStatus === "MARKED"
        ? "Change at least one recorded mark before submitting a correction."
        : "Nothing to record — provide at least one absent or present learner"); return;
    }
    setConfirmingAttendance(true);
  }

  async function submitAttendance() {
    if (!selectedSession) { setError("Please select a class."); return; }
    if (markingWindow !== "OPEN" || submitting || submitLock.current) return;

    setError(null);
    if(selectedSession.attendanceStatus==="MARKED"&&!facultyCorrectionReasonValid(correctionReason)){
      setError("Explain this attendance correction in at least 8 characters.");return;
    }
    if (!attendanceConfirmation) {
      setError(selectedSession.attendanceStatus === "MARKED"
        ? "Change at least one recorded mark before submitting a correction."
        : "Nothing to record — provide at least one absent or present learner");
      return;
    }
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
      setConfirmingAttendance(false);
    }
  }

  async function createSession(
    event: FormEvent<HTMLFormElement>|null,
    confirmed=false,
  ) {
    event?.preventDefault();
    if (scheduling || scheduleLock.current) return;

    setScheduleError(null);
    if (!startsAt.trim()) { setScheduleError("Select Date"); return; }
    if (!endsAt.trim()) { setScheduleError("Select End Time"); return; }
    try {
      const timing = facultyScheduleInstants(startsAt, endsAt);
      if(!confirmed){setConfirmScheduleOpen(true);return;}
      scheduleLock.current=true;
      setScheduling(true);
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
        "Failed to schedule class.");
    } finally {
      if(confirmed){scheduleLock.current=false;setScheduling(false);setConfirmScheduleOpen(false);}
    }
  }

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      {savedNotice?<Alert tone="success">{savedNotice}</Alert>:null}
      <section className="border-b border-border pb-4">
        <PageHeader
          title="Attendance"
          eyebrow={workspace.course.courseCode + " · " + workspace.course.sectionName}
          description="See attendance history and monthly trends in one place."
          actions={<Button variant="secondary" onClick={() => setScheduleOpen(true)}>Schedule Class</Button>}
        />
        <p className="text-xs text-muted-foreground">
          {workspace.course.courseName} · {workspace.course.academicPeriodName}
        </p>

        <SegmentedControl
          className="mt-4 w-full md:w-auto"
          label="Attendance view"
          value={mode}
          options={[{value:"REPORT",label:"Attendance report"},{value:"MARK",label:"Mark attendance"}]}
          onChange={(next) => {
            if (next === "REPORT" || next === "MARK") {
              confirmDiscardMarks(() => setMode(next));
            }
          }}
        />

      </section>

      {mode === "REPORT" ? (
        <>
          <section className="border-b border-border pb-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="info">
                  {heldMonthSessions.length} held sessions
                </StatusBadge>
                <StatusBadge
                  tone={
                    monthSummary.markedSessions === heldMonthSessions.length &&
                    heldMonthSessions.length > 0
                      ? "success"
                      : "warning"
                  }
                >
                  {monthSummary.markedSessions} marked
                </StatusBadge>
              </div>
              <div className="flex min-w-0 items-end gap-[var(--lms-space-2)]">
                <Button
                  size="md"
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
                <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  Jump to month
                  <Input
                    className="w-full"
                    type="month"
                    value={month}
                    onChange={(event) =>
                      setMonth(event.target.value)
                    }
                  />
                </label>
                <Button
                  size="md"
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

          <section aria-label="Monthly class health" className="border-b border-border pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-body">Monthly class health</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  See each student&apos;s attendance day by day for this month.
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {monthSummary.averagePercent === null ? "—" : monthSummary.averagePercent + "%"}
                </p>
                <p className="mt-2 max-w-xl text-xs leading-5 text-muted-foreground">
                  {monthSummary.presentMarks} present marks across {heldMonthSessions.length} held sessions.
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
            <SummaryStrip label="Faculty monthly attendance summary" steps={[
              {label:"Students",value:monthSummary.learnerCount},
              {label:"Sessions",value:heldMonthSessions.length},
              {label:"Absences",value:monthSummary.absentMarks},
              {label:"Not marked",value:monthSummary.unmarkedMarks},
              {label:"Active days",value:new Set(heldMonthSessions.map(session=>indiaAttendanceDayKey(session.startsAt))).size},
              {label:"Upcoming",value:monthSummary.upcomingSessions},
            ]}/>
            <section aria-label="Attendance threshold guidance" className="mt-[var(--lms-space-4)] border-t border-border pt-[var(--lms-space-4)]">
              <h3 className="text-sm font-semibold text-[var(--lms-heading)]">
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
                <ul className="mt-3 grid gap-2 md:grid-cols-2">
                  {attendanceRisk.below.map((membershipId) => {
                    const learner = workspace.roster.find((row) => row.membershipId === membershipId);
                    const summary = monthSummary.learners.find((row) => row.membershipId === membershipId);
                    return (
                      <li key={membershipId} className="min-w-0 border-b border-border py-[var(--lms-space-2)]">
                        <Button
                          type="button"
                          onClick={() => setSelectedLearnerId(membershipId)}
                          variant="link"
                          aria-label={`Inspect monthly attendance for ${learner ? learnerName(learner) : membershipId}`}
                          className="text-left text-primary-text hover:underline"
                        >
                          {learner ? learnerName(learner) : "Learner"} · {summary?.percentage ?? "—"}%
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>
          </section>

          {allLearners.length === 0 ? (
            <EmptyState
              title="No learners to display"
              description="There are no enrolled learners or historical attendance rows for this Course and Section."
            />
          ) : (
            <section className="min-w-0">
              
              <h2 className="mb-3 text-base font-semibold text-foreground">Monthly Attendance</h2>
              <p className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-label="Attendance legend">
                <StatusBadge tone="success">P</StatusBadge> Present
                <StatusBadge tone="error">A</StatusBadge> Absent
                <StatusBadge tone="warning">—</StatusBadge> Not marked yet
                <StatusBadge tone="neutral">✖</StatusBadge> No class
              </p>
              <Table scrollLabel="Faculty attendance monthly grid" className="min-w-[48rem]">
                <thead className="border-b border-border bg-[var(--lms-table-header)] text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="sticky left-0 z-10 bg-[var(--lms-table-header)] px-3 py-3">
                      Student Name
                    </th>
                    {calendarDays.map((day) => (
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
                          new Date(day.dayKey + "T12:00:00+05:30"),
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
                        <Button
                          type="button"
                          onClick={() => setSelectedLearnerId(learner.membershipId)}
                          variant="link"
                          aria-label={`View attendance details for ${learnerName(learner)}`}
                          className="m-0 text-left text-primary-text hover:underline focus-visible:rounded"
                        >
                          {learnerName(learner)}
                        </Button>
                        {learner.rollNumber ? <p className="mt-1 text-xs text-muted-foreground">Roll {learner.rollNumber}</p> : null}
                      </td>
                      {calendarDays.map((day) => {
                        if (day.sessions.length === 0) {
                          return <td key={day.dayKey} aria-label="No class" className="px-3 py-3 text-center"><StatusBadge tone="neutral">✖</StatusBadge></td>;
                        }
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
              </Table>
              
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Extra indicators: S = future class · x/y = present sessions / all sessions that day.
              </p>
            </section>
          )}
        </>
      ) : (
        <>
          {workspace.sessions.length === 0 ? (
            <div className="space-y-3">
              <EmptyState title="No class scheduled for this date"
                description="Use Schedule Class to create a class session before marking attendance." />
              <Button type="button" variant="secondary" onClick={() => setScheduleOpen(true)}>Schedule Class</Button>
            </div>
          ) : (
            <section className="border-b border-border pb-4">
              <div className="grid min-w-0 gap-[var(--lms-space-4)] lg:grid-cols-[minmax(16rem,24rem)_1fr]">
                <div>
                  <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                    Date
                    <Input type="date" className="mt-[6px]" value={selectedDate}
                      onChange={event=>chooseDate(event.target.value)}/>
                  </label>
                  <label htmlFor={sessionSelectId} className="mt-3 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                    Class session
                  </label>
                  <Select
                    id={sessionSelectId}
                    className="w-full"
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
                  <div className="border-l-2 border-border pl-[var(--lms-space-3)] text-sm text-body">
                    <h2 className="m-0 font-semibold text-foreground">Attendance Session</h2>
                    <p className="mt-1 font-medium text-foreground">
                      {selectedSession.title}
                    </p>
                    <div className="mt-2">
                      <StatusBadge tone={markingWindow === "OPEN" ? "success" : "warning"}>
                        {markingWindow === "OPEN" ? "Ready to mark" : "Marking unavailable"}
                      </StatusBadge>
                    </div>
                    <p className="mt-1">
                      {sessionTime(selectedSession)}
                      {selectedSession.location
                        ? ` · ${selectedSession.location}`
                        : ""}
                    </p>
                    {markingWindow !== "OPEN" ? (
                      <p role="status" className="mt-2 text-sm font-semibold text-warning">
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
              {selectedSession ? <div role="group" aria-label="Attendance summary" className="mt-4 grid grid-cols-3 gap-3 border-y border-border py-3 text-center">
                <p className="text-xs text-muted-foreground">Students <strong className="block text-lg tabular-nums text-foreground">{workspace.roster.length}</strong></p>
                <p className="text-xs text-muted-foreground">Present <strong className="block text-lg tabular-nums text-foreground">{Math.max(0, workspace.roster.length - absent.size)}</strong></p>
                <p className="text-xs text-muted-foreground">Absent <strong className="block text-lg tabular-nums text-foreground">{absent.size}</strong></p>
              </div> : null}
              <div className="mt-[var(--lms-space-4)] flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-2 md:max-w-sm md:flex-1">
                  <span aria-hidden="true" className="text-muted-foreground">⌕</span>
                  <Input className="min-w-0 w-full" aria-label="Find a student by name"
                    placeholder="Find a student by name" value={search}
                    onChange={(event) => setSearch(event.target.value)} />
                  {search ? <Button type="button" variant="secondary" size="sm" onClick={() => setSearch("")}>Clear</Button> : null}
                </div>
                <div className="grid grid-cols-2 gap-[var(--lms-space-2)] [&>button]:w-full md:flex md:flex-wrap md:[&>button]:w-auto">
                  <Button
                    size="md"
                    variant="secondary"
                    disabled={
                      workspace.roster.length === 0 || markingWindow !== "OPEN" || submitting
                    }
                    onClick={() =>
                      setAbsent(new Set())
                    }
                  >
                    Mark all present
                  </Button>
                  <Button
                    size="md"
                    variant="secondary"
                    disabled={
                      workspace.roster.length === 0 || markingWindow !== "OPEN" || submitting
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
                className="mt-[var(--lms-space-4)] max-h-[420px] min-w-0 overflow-auto border-y border-border"
                aria-label="Attendance roster" role="region" tabIndex={0}
              >
                <div aria-hidden="true" className="sticky top-0 z-10 grid min-w-[500px] grid-cols-2 border-b border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground">
                  <span>Student Name</span><span>Status</span>
                </div>
                {visibleRoster.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    No learners match this search.
                  </p>
                ) : (
                  <ul className="min-w-[500px] divide-y divide-border">
                    {visibleRoster.map(
                      (learner) => {
                        const isAbsent = absent.has(
                          learner.membershipId,
                        );
                        return (
                          <li
                            key={learner.membershipId}
                            className="grid min-w-0 grid-cols-2 items-center gap-3 px-3 py-3"
                          >
                            <div>
                              <p className="m-0 text-sm font-semibold text-foreground">
                                {learnerName(learner)}
                              </p>
                              {learner.rollNumber ? <p className="mt-1 text-xs text-muted-foreground">Roll {learner.rollNumber}</p> : null}
                            </div>
                            <div className="grid grid-cols-2 gap-2 [&>button]:w-full" role="group" aria-label={"Attendance for "+learnerName(learner)}>
                              <Button
                                size="md"
                                className="min-h-11 md:min-h-9"
                                variant={
                                  !isAbsent
                                    ? "primary"
                                    : "secondary"
                                }
                                disabled={markingWindow !== "OPEN" || submitting}
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
                                <span aria-hidden="true">✓ P</span><span className="sr-only">Present</span>
                              </Button>
                              <Button
                                size="md"
                                className="min-h-11 md:min-h-9"
                                variant={
                                  isAbsent
                                    ? "danger"
                                    : "secondary"
                                }
                                disabled={markingWindow !== "OPEN" || submitting}
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
                                <span aria-hidden="true">× A</span><span className="sr-only">Absent</span>
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
                <label className="mt-4 block space-y-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
                  Correction explanation (required)
                  <Textarea value={correctionReason} maxLength={500} rows={3}
                    className="w-full text-[var(--lms-font-base)] font-normal"
                    placeholder="What changed in the recorded attendance?"
                    onChange={event=>setCorrectionReason(event.target.value)}/>
                  <span className="block text-xs font-normal text-muted-foreground">
                    This explanation is retained in the activity audit without learner names.
                  </span>
                </label>
              ):null}
              {selectedSession?.attendanceStatus === "MARKED" ? (
                <p role="status" className="mt-3 text-sm text-muted-foreground">
                  {attendanceConfirmation ?? "No recorded marks have changed. Choose a changed mark to correct attendance."}
                </p>
              ) : null}
              <div className="sticky bottom-0 z-20 mt-[var(--lms-space-4)] flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] border-t border-border bg-surface px-0 py-[var(--lms-space-3)] md:static md:flex-row md:items-center md:justify-between">
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
                  onClick={requestAttendanceConfirmation}
                  className="min-h-11 w-full md:min-h-9 md:w-auto"
                >
                  {submitting
                    ? "Submitting…"
                    : "Submit Attendance"}
                </Button>
              </div>
              {error ? (
                <div
                  role="alert"
                  className="mt-3 text-sm font-semibold text-error"
                >
                  {error}
                  <span className="mt-2 block text-sm font-normal text-body">
                    Attendance saves are atomic: no partial roster will be committed on a rejected request.
                    Reload the saved roster before retrying if the connection was interrupted.
                  </span>
                  <Button size="md" variant="secondary" onClick={() => setConfirmingRosterReload(true)}>
                    Reload saved roster
                  </Button>
                </div>
              ) : null}
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmingAttendance}
        onOpenChange={setConfirmingAttendance}
        title="Submit Attendance"
        description={selectedSession?.attendanceStatus === "MARKED"
          ? (attendanceConfirmation ?? "Review attendance corrections before submitting.")
          : ("Mark " + absent.size + " students absent and " + (workspace.roster.length - absent.size) + " students present?")}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        confirmVariant="primary"
        pending={submitting}
        confirmDisabled={!selectedSession || markingWindow !== "OPEN" || !attendanceConfirmation}
        onConfirm={() => void submitAttendance()}
      />
      <ConfirmDialog
        open={confirmingRosterReload}
        onOpenChange={setConfirmingRosterReload}
        title="Reload saved attendance?"
        description="This reloads marks recorded on the server and discards any unsaved selections in this page."
        confirmLabel="Reload roster"
        confirmVariant="danger"
        onConfirm={() => window.location.reload()}
      />
      {selectedLearner ? (
      <Drawer
        open={true}
        onOpenChange={(open) => { if (!open) setSelectedLearnerId(null); }}
        title={selectedLearner ? learnerName(selectedLearner) + " attendance" : "Learner attendance"}
        description={`Recorded class sessions for ${month}. Unmarked and upcoming sessions are not included in the attendance percentage.`}
      >
        {selectedLearner && learnerDetail ? (
          <div className="min-w-0 space-y-[var(--lms-space-4)]">
            <p className="text-sm text-body">
              {[selectedLearner.rollNumber ? "Roll " + selectedLearner.rollNumber : null,
                selectedLearner.email, selectedLearner.phoneE164].filter(Boolean).join(" · ") ||
                "Contact details unavailable"}
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[
                ["Present", learnerDetail.present],
                ["Absent", learnerDetail.absent],
                ["Not marked", learnerDetail.unmarked],
                ["Upcoming", learnerDetail.upcoming],
                ["Marked", learnerDetail.marked],
                ["Attendance", learnerDetail.attendedPercent === null ? "—" : learnerDetail.attendedPercent + "%"],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-border py-[var(--lms-space-3)]">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <h3 className="text-base font-semibold text-[var(--lms-heading)]">Session history</h3>
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
                    <li key={session.id} className="border-b border-border py-[var(--lms-space-4)]">
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
                          size="md"
                          variant="secondary"
                          onClick={() => {
                            confirmDiscardMarks(() => {
                              setSelectedSessionId(session.id);
                              setAbsent(initialAbsencesForSession(workspace.roster,workspace.records,session.id));
                              setSearch("");setError(null);setCorrectionReason("");setSavedNotice(null);
                              setMode("MARK");setSelectedLearnerId(null);
                            });
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
        dismissible
        onOpenChange={value=>{if(!value)closeScheduleDrawer();}}
        title="Schedule Class"
        description="Create a class session for this exact Course and Section. It will appear in learner and Faculty calendars."
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button
              variant="secondary"
              onClick={closeScheduleDrawer}
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
          </div>
        }
      >
        <form
          id="faculty-schedule-class-form"
          onSubmit={createSession}
          className="grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-4)] md:grid-cols-2"
        >
          <label className="grid min-w-0 gap-2 font-semibold md:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Class title
            <Input
              className="w-full"
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
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Starts at (IST)
            <Input
              className="w-full"
              type="datetime-local"
              value={startsAt}
              onChange={(event) =>
                setStartsAt(event.target.value)
              }
            />
          </label>
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Ends at (IST)
            <Input
              className="w-full"
              type="datetime-local"
              value={endsAt}
              onChange={(event) =>
                setEndsAt(event.target.value)
              }
            />
          </label>
          <label className="grid min-w-0 gap-2 font-semibold md:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Location
            <Input
              className="w-full"
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
              className="text-sm font-semibold text-error md:col-span-2"
            >
              {scheduleError}
            </p>
          ) : null}
        </form>
      </Drawer>
      <ConfirmDialog open={discardOpen} onOpenChange={open=>{
          if(!open){nextAfterDiscard.current=null;setDiscardOpen(false);}
        }} title="Discard your unsaved attendance changes?"
        confirmLabel="Discard changes" confirmVariant="danger"
        onConfirm={()=>{
          const next=nextAfterDiscard.current;
          nextAfterDiscard.current=null;setDiscardOpen(false);next?.();
        }}/>
      <ConfirmDialog open={confirmScheduleDiscardOpen}
        onOpenChange={setConfirmScheduleDiscardOpen}
        title="Discard class schedule changes?"
        confirmLabel="Discard changes" cancelLabel="Keep editing"
        confirmVariant="danger"
        onConfirm={() => {
          setConfirmScheduleDiscardOpen(false);
          setScheduleOpen(false);
          setScheduleTitle("");setStartsAt("");setEndsAt("");setLocation("");
          setScheduleError(null);
        }}/>
      <ConfirmDialog open={confirmScheduleOpen} onOpenChange={setConfirmScheduleOpen}
        title={"Confirm attendance session from "+startsAt.replace("T"," ")+" to "+endsAt.replace("T"," ")+" IST?"}
        confirmLabel="Confirm" confirmVariant="primary"
        pending={scheduling} onConfirm={()=>void createSession(null,true)}/>

    </div>
  );
}
