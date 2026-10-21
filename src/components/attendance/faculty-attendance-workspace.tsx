"use client";
import { SummaryStrip } from "@/components/ui/summary-strip";
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

function legacySessionDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric",
  }).format(new Date(value));
}
function legacyClockTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true,
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
  const monthLabel = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "long", year: "numeric" })
    .format(new Date(month + "-01T12:00:00+05:30"));
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
  const nextAfterScheduleDiscard=useRef<(()=>void)|null>(null);
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
  const [location, setLocation] = useState("");
  const scheduleBaseline = useRef({ start: "", end: "" });
  const scheduleDirty = Boolean(scheduleTitle.trim() || location.trim() ||
    startsAt !== scheduleBaseline.current.start || endsAt !== scheduleBaseline.current.end);
  // Legacy authoring uses one date and separate 12-hour time fields. Retain
  // ISO-local datetime values internally for the existing signed IST converter.
  function setScheduleWallTimes(date: string, startTime: string, endTime: string) {
    const beginning = date && startTime ? date + "T" + startTime : "";
    const minutes = (time: string) => {
      const [hour, minute] = time.split(":").map(Number);
      return hour * 60 + minute;
    };
    let endDate = date;
    if (date && startTime && endTime && minutes(endTime) < minutes(startTime)) {
      endDate = indiaAttendanceDayKey(new Date(
        new Date(date + "T12:00:00+05:30").getTime() + 24 * 60 * 60 * 1000,
      ));
    }
    const finish = endDate && endTime ? endDate + "T" + endTime : "";
    setStartsAt(beginning);
    setEndsAt(finish);
  }
  function openScheduleDrawer() {
    const start = selectedDate + "T09:00";
    const end = selectedDate + "T10:00";
    scheduleBaseline.current = { start, end };
    setScheduleTitle("");
    setStartsAt(start);
    setEndsAt(end);
    setLocation("");
    setScheduleError(null);
    setScheduleOpen(true);
  }

  function closeScheduleDrawer() {
    if (scheduling || scheduleLock.current) {
      setScheduleError("Wait for the class schedule to finish saving.");
      return;
    }
    if (scheduleDirty) {
      nextAfterScheduleDiscard.current = () => setScheduleOpen(false);
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
  useEffect(() => {
    if (!unsavedMarks && !(scheduleOpen && scheduleDirty)) return;
    const guardNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
          event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      const anchor = target instanceof Element ? target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download") ||
          (anchor.target && anchor.target !== "_self")) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      event.preventDefault();
      event.stopPropagation();
      const navigate = () => router.push(url.pathname + url.search + url.hash);
      const afterMarks = () => {
        if (scheduleOpen && scheduleDirty) {
          nextAfterScheduleDiscard.current = navigate;
          setConfirmScheduleDiscardOpen(true);
        } else navigate();
      };
      if (unsavedMarks) {
        nextAfterDiscard.current = afterMarks;
        setDiscardOpen(true);
      } else afterMarks();
    };
    document.addEventListener("click", guardNavigation, true);
    return () => document.removeEventListener("click", guardNavigation, true);
  }, [unsavedMarks, scheduleOpen, scheduleDirty, router]);

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
    if (workspace.roster.length > 500) {
      setError("Maximum 500 learners per attendance request. Contact your College administrator to review this roster.");
      return;
    }
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
    let persisted = false;
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
      persisted = true;
      setCorrectionReason("");
      setSavedNotice(`Attendance recorded for ${workspace.roster.length} learner(s).`);
      router.refresh();
    } catch {
      setError(
        "Unable to confirm attendance save. Refresh the roster before retrying to avoid duplicate changes.",
      );
    } finally {
      submitLock.current = false;
      setSubmitting(false);
      if (persisted) setConfirmingAttendance(false);
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
            title: scheduleTitle.trim() || workspace.course.courseName,
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
    <div className="min-w-0 space-y-[var(--lms-space-4)] [--legacy-attendance-panel-gap:var(--lms-space-4)]">
      {savedNotice?<Alert tone="success">{savedNotice}</Alert>:null}
      <section aria-label="Attendance toolbar" className="border-b border-border pb-4">
        <h1 className="sr-only">Attendance</h1>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">
            {workspace.course.courseName} · {workspace.course.sectionName} · {workspace.course.academicPeriodName}
          </p>
        </div>

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
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Button>
                <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  <span className="sr-only">Jump to month</span>
                  <Input
                    aria-label="Jump to month"
                    className="w-40"
                    type="month"
                    value={month}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(next)) setMonth(next);
                    }}
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
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </Button>
              </div>
            </div>
          </section>

          <section aria-label="Monthly class health" className="learn-attendance-summary learn-attendance-summary--faculty border-b border-border pb-4">
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
                  {heldMonthSessions.length > 0 ? `${monthSummary.presentMarks} present marks across ${heldMonthSessions.length} scheduled sessions.` : "No scheduled sessions found for this month."}
                   {monthSummary.unmarkedSessions > 0 ? ` ${monthSummary.unmarkedSessions} session${monthSummary.unmarkedSessions === 1 ? "" : "s"} not yet marked, excluded from this percentage.` : null}
                </p>
              </div>
              
            </div>
            <SummaryStrip label="Faculty monthly attendance summary" steps={[
               {label:"Students",value:monthSummary.learnerCount},
               {label:"Sessions",value:heldMonthSessions.length},
               {label:"Absences",value:monthSummary.absentMarks},
               ...(monthSummary.unmarkedSessions > 0 ? [{label:"Not marked",value:monthSummary.unmarkedSessions}] : []),
             ]}/>
             {monthSummary.upcomingSessions > 0 ? <p className="mt-2 text-xs text-muted-foreground">
               {monthSummary.upcomingSessions} upcoming sessions, excluded from attendance for held classes.
             </p> : null}
            
          </section>

          {allLearners.length === 0 || monthSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <EmptyState title={allLearners.length === 0 ? "No learners to display" : "No attendance data for this month"}
                description={allLearners.length === 0 ? "There are no enrolled learners or historical attendance rows for this Course and Section." : "No scheduled sessions found for this month."}/>
              <Button disabled type="button" variant="secondary" aria-label="Download Report unavailable with no attendance data">Download Report</Button>
            </div>
          ) : (
            <section className="learn-attendance-grid-card min-w-0">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-base font-semibold text-foreground">Monthly Attendance</h2>
                  <p className="mt-1 text-xs text-muted-foreground">See each student’s attendance day by day for this month.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-muted-foreground"><strong className="tabular-nums text-foreground">{new Set(heldMonthSessions.map(session => indiaAttendanceDayKey(session.startsAt))).size}</strong> Active days</span>
                  <strong className="text-xs text-foreground">{monthLabel}</strong>
                  {monthSummary.learnerCount > 0 && monthSummary.sessionCount > 0 ? (
                <FacultyReportDownload
                  kind="attendance"
                  title={workspace.course.courseName + " " + monthLabel}
                  subtitle={workspace.course.courseCode + " · " + workspace.course.sectionName}
                  summary={[
                    "Month: " + monthLabel + " (Asia/Kolkata)",
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
                        learner?.displayName?.trim() || "Name not recorded",
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
              ) : <Button type="button" variant="secondary" disabled aria-label="Download Report unavailable with no attendance data">Download Report</Button>}
                </div>
              </div>
              <p className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-label="Attendance legend">
                <StatusBadge tone="success">P = Present</StatusBadge>
                <StatusBadge tone="error">A = Absent</StatusBadge>
                <StatusBadge tone="warning">— = Not marked yet</StatusBadge>
                <StatusBadge tone="neutral">✖ = No class</StatusBadge>
              </p>
              <Table scrollLabel="Faculty attendance monthly grid" className="min-w-[48rem]">
                <caption className="sr-only">Attendance by student and day for {monthLabel}</caption>
                <thead className="border-b border-border bg-[var(--lms-table-header)] text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th scope="col" aria-label="Student name" className="sticky left-0 z-10 bg-[var(--lms-table-header)] px-3 py-2" />
                    {calendarDays.map(day=><th scope="col" key={day.dayKey+"-weekday"} className={"min-w-16 px-2 py-2 text-center " + (new Date(day.dayKey + "T12:00:00+05:30").getUTCDay() === 0 ? "text-error" : "")} aria-label={day.dayKey}>{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"short"})
                      .format(new Date(day.dayKey+"T12:00:00+05:30")).slice(0,1)}</th>)}
                  </tr>
                  <tr><th scope="col" className="sticky left-0 z-10 bg-[var(--lms-table-header)] px-3 py-2">Student Name</th>
                    {calendarDays.map(day=><th scope="col" key={day.dayKey} className={"min-w-16 px-2 py-2 text-center " + (new Date(day.dayKey + "T12:00:00+05:30").getUTCDay() === 0 ? "text-error" : "")} title={day.sessions.map(session=>sessionTime(session)).join(" · ")}>{Number(day.dayKey.slice(-2))}
                      {day.sessions.length>1?<span className="ml-1 text-[10px] font-normal text-muted-foreground">×{day.sessions.length}</span>:null}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allLearners.map((learner) => (
                    <tr key={learner.membershipId} className="[content-visibility:auto] [contain-intrinsic-size:auto_64px]">
                      <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-3 text-left">
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
                      </th>
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
                            className={`relative px-3 py-3 text-center ${state.code === "MIXED" ? "partial" : ""}`}
                          >
                            {day.sessions.length > 1 ? (
                              <details className="relative" onKeyDown={event => {
                                if (event.key === "Escape") { event.currentTarget.open = false; event.stopPropagation(); }
                              }} onMouseEnter={event => { event.currentTarget.open = true; }}
                                onMouseLeave={event => { event.currentTarget.open = false; }}>
                                <summary className="cursor-pointer list-none focus-visible:outline-2 focus-visible:outline-primary"
                                  aria-label={state.label + ". Show session attendance details"}>
                                  <StatusBadge tone={tone}>{state.ratio ?? state.code}</StatusBadge>
                                </summary>
                                <div className="absolute bottom-full left-0 z-30 min-w-48 rounded-lg border border-border bg-surface p-2 text-xs shadow-lg">
                                  <table className="w-full text-left">
                                    <thead><tr><th scope="col" className="pr-3">Session Time</th><th scope="col">Attendance</th></tr></thead>
                                    <tbody>{day.sessions.map(session => {
                                      const record = recordsByKey.get(session.id + ":" + learner.membershipId);
                                      const code = new Date(session.startsAt).getTime() > clock.getTime() ? "S" :
                                        record?.status === "ABSENT" ? "A" :
                                        record || session.attendanceStatus === "MARKED" ? "P" : "N";
                                      return <tr key={session.id}><td className="pr-3">{new Intl.DateTimeFormat("en-IN", {
                                        timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",hour12:true,
                                      }).format(new Date(session.startsAt))}</td><td>{code}</td></tr>;
                                    })}</tbody>
                                  </table>
                                </div>
                              </details>
                            ) : <StatusBadge tone={tone}>{state.code}</StatusBadge>}
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
        </>
      ) : (
        <>
          {dateSessions.length === 0 ? (
            <div className="space-y-3">
              <label className="block max-w-xs text-[13px] font-semibold text-muted-foreground">
                Select Date
                <Input type="date" aria-label="Select Date" className="mt-[6px] w-full" value={selectedDate}
                  onChange={event => chooseDate(event.target.value)} />
              </label>
              <EmptyState title="No class scheduled for this date"
                description="Use Schedule Class to create a class session before marking attendance." />
              <Button type="button" variant="secondary" onClick={openScheduleDrawer}>Schedule Class</Button>
            </div>
          ) : (
            <section className="take-attendance-panel border-b border-border pb-4">
              <div className="take-attendance-panel__header grid min-w-0 gap-[var(--lms-space-4)] lg:grid-cols-[minmax(16rem,24rem)_1fr]">
                <div>
                  <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                    Date
                    <Input type="date" aria-label="Select Date" className="mt-[6px]" value={selectedDate}
                      onChange={event=>chooseDate(event.target.value)}/>
                  </label>
                  <label htmlFor={sessionSelectId} className="mt-3 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                    Class Start Time
                  </label>
                  <Select
                    aria-label="Select Class"
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
                          {legacyClockTime(session.startsAt)}
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
                      {legacySessionDate(selectedSession.startsAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{selectedSession.title}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge tone={markingWindow === "OPEN" ? "success" : "warning"}>
                        {markingWindow === "OPEN" ? "Ready to mark" : "Marking unavailable"}
                      </StatusBadge>
                      <Button type="button" variant="secondary" onClick={openScheduleDrawer}>Schedule Class</Button>
                    </div>
                    <p className="mt-1">
                      {legacyClockTime(selectedSession.startsAt)} - {legacyClockTime(selectedSession.endsAt)}
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
              {selectedSession ? <div role="group" aria-label="Attendance summary" className="take-attendance-panel__summary mt-4 grid grid-cols-3 gap-3 border-y border-border py-3 text-center">
                <p className="text-xs text-muted-foreground">Students <strong className="block text-lg tabular-nums text-foreground">{workspace.roster.length}</strong></p>
                <p className="text-xs text-muted-foreground">Present <strong className="block text-lg tabular-nums text-foreground">{Math.max(0, workspace.roster.length - absent.size)}</strong></p>
                <p className="text-xs text-muted-foreground">Absent <strong className="block text-lg tabular-nums text-foreground">{absent.size}</strong></p>
              </div> : null}
              <div className="take-attendance-panel__tools mt-[var(--lms-space-4)] flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-2 md:max-w-sm md:flex-1">
                  <svg aria-hidden="true" className="shrink-0 text-muted-foreground" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
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

              <div className="mt-[var(--lms-space-4)] max-h-[420px] min-w-0 overflow-auto border-y border-border"
                aria-label="Attendance roster" role="region" tabIndex={0}>
                <table className="min-w-[500px] w-full table-fixed border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-border bg-surface text-xs font-semibold text-muted-foreground">
                    <tr><th scope="col" className="w-1/2 px-3 py-2">Student Name</th><th scope="col" className="w-1/2 px-3 py-2">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleRoster.length === 0 ? (
                      <tr><td colSpan={2} className="p-6 text-sm text-muted-foreground">
                        {workspace.roster.length === 0 ? "No learners are enrolled in this class." : "No learners match this search."}
                      </td></tr>
                    ) : visibleRoster.map(learner => {
                      const isAbsent = absent.has(learner.membershipId);
                      return <tr key={learner.membershipId} className="[content-visibility:auto] [contain-intrinsic-size:auto_72px]">
                        <th scope="row" className="w-1/2 px-3 py-3 text-left align-middle">
                          <div className="flex min-w-0 items-center gap-2">
                            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-[var(--lms-neutral-100)] text-[10px] font-semibold text-foreground">
                              {learnerName(learner).split(/\s+/u).filter(Boolean).slice(0,2).map(part=>Array.from(part)[0] ?? "").join("").toLocaleUpperCase("en-IN")}
                            </span>
                            <div className="min-w-0">
                              <span className="block break-words text-sm font-semibold text-foreground">{learnerName(learner)}</span>
                              {learner.rollNumber ? <span className="mt-1 block text-xs font-normal text-muted-foreground">Roll {learner.rollNumber}</span> : null}
                            </div>
                          </div>
                        </th>
                        <td className="w-1/2 px-3 py-3 align-middle">
                          <div className="grid grid-cols-2 gap-2 [&>button]:w-full" role="group" aria-label={"Attendance for "+learnerName(learner)}>
                              <Button
                                size="md"
                                className={"min-h-11 rounded-lg border px-[14px] text-[13px] font-semibold md:min-h-9 " +
                                  (!isAbsent ? "!border-[rgba(34,139,83,0.28)] !bg-[rgba(34,139,83,0.08)] !text-[#228b53]" : "!border-[#dce0e8] !bg-[#f8f9fb] !text-[#64748b]")}
                                variant="secondary"
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
                                className={"min-h-11 rounded-lg border px-[14px] text-[13px] font-semibold md:min-h-9 " +
                                  (isAbsent ? "!border-[rgba(220,38,38,0.28)] !bg-[rgba(220,38,38,0.08)] !text-[#dc2626]" : "!border-[#dce0e8] !bg-[#f8f9fb] !text-[#64748b]")}
                                variant="secondary"
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
                        </td>
                      </tr>;
                    })}
                  </tbody>
                </table>
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
              <div className="take-attendance-panel__submit sticky bottom-0 z-20 mt-[var(--lms-space-4)] flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] border-t border-border bg-surface px-0 py-[var(--lms-space-3)] md:static md:flex-row md:items-center md:justify-between">
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
        onOpenChange={next => { if (!submitting) setConfirmingAttendance(next); }}
        title="Submit Attendance"
        description={error ?? (selectedSession?.attendanceStatus === "MARKED"
          ? (attendanceConfirmation ?? "Review attendance corrections before submitting.")
          : ("Mark " + absent.size + (absent.size === 1 ? " student" : " students") + " absent and " + (workspace.roster.length - absent.size) + ((workspace.roster.length - absent.size) === 1 ? " student" : " students") + " present?"))}
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
                : "Schedule"}
            </Button>
          </div>
        }
      >
        <form
          id="faculty-schedule-class-form"
          autoComplete="off"
          onSubmit={createSession}
          className="grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-4)]"
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
              maxLength={200}
              placeholder={workspace.course.courseName}
            />
          </label>
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Date
            <Input type="date" className="w-full" required
              value={startsAt.split("T")[0] || selectedDate}
              onChange={event => setScheduleWallTimes(
                event.target.value, startsAt.split("T")[1] || "", endsAt.split("T")[1] || "",
              )}/>
          </label>
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Course
            <Input className="w-full" value={workspace.course.courseName} disabled readOnly/>
          </label>
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Start Time (IST)
            <Input type="time" lang="en-US" className="w-full" required
              value={startsAt.split("T")[1] || ""}
              onChange={event => setScheduleWallTimes(
                startsAt.split("T")[0] || selectedDate,event.target.value,endsAt.split("T")[1] || "",
              )}/>
          </label>
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            End Time (IST)
            <Input type="time" lang="en-US" className="w-full" required
              value={endsAt.split("T")[1] || ""}
              onChange={event => setScheduleWallTimes(
                startsAt.split("T")[0] || selectedDate,startsAt.split("T")[1] || "",event.target.value,
              )}/>
            <span className="text-xs font-normal text-muted-foreground">Class duration must be 12 hours or less. An earlier end time uses the next day.</span>
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
        onOpenChange={open => { if (!open) nextAfterScheduleDiscard.current = null; setConfirmScheduleDiscardOpen(open); }}
        title="Discard class schedule changes?"
        confirmLabel="Discard changes" cancelLabel="Keep editing"
        confirmVariant="danger"
        onConfirm={() => {
          const next = nextAfterScheduleDiscard.current;
          nextAfterScheduleDiscard.current = null;
          setConfirmScheduleDiscardOpen(false);
          setScheduleOpen(false);
          setScheduleTitle("");setStartsAt("");setEndsAt("");setLocation("");
          setScheduleError(null);
          next?.();
        }}/>
      <ConfirmDialog open={confirmScheduleOpen} onOpenChange={setConfirmScheduleOpen}
        title={"Confirm attendance session from "+startsAt.replace("T"," ")+" to "+endsAt.replace("T"," ")+" IST?"}
        confirmLabel="Confirm" confirmVariant="primary"
        pending={scheduling} onConfirm={()=>void createSession(null,true)}/>

    </div>
  );
}
