"use client";

import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
import {adminAttendanceCorrectionChange} from "@/modules/attendance/admin-correction-change-model";
import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";

import {
  adminAttendanceCellState,
  adminAttendancePercent,
  adminAttendanceDayRatio,
  attendanceCsvCell,
  attendanceIndiaDay,
  attendanceMonthDays,
  attendanceMonthLabel,
  shiftAttendanceMonth,
} from "@/modules/attendance/admin-grid-model";

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
  isPast:boolean;
  offeringType:"CORE"|"ELECTIVE";
};

type CourseOption = { id: string; name: string; code: string };

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
  courses: CourseOption[];
  selectedSectionId: string | null;
  selectedCourseId: string | null;
  showAllCourses: boolean;
  selectedDeliveryId: string | null;
  month: string;
  /** Server-side grid read failed; null grid does not imply empty attendance. */
  gridLookupFailed?: boolean;
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

function codeFor(session: Session, record: RecordRow | undefined) {
  const state = adminAttendanceCellState(session, record);
  return {
    ...state,
    tone: state.code === "P" ? ("success" as const) :
      state.code === "S" ? ("neutral" as const) :
      state.code === "—" ? ("warning" as const) : ("error" as const),
  };
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
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
  const [refreshing, startRefresh] = useTransition();
  const correctionGuard=useGuardedAction({busyLabel:"Correcting attendance..."});
  const [target, setTarget] =
    useState<CellTarget | null>(null);
  const [correcting, setCorrecting] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [notice,setNotice]=useState<string|null>(null);
  const [absenceReason,setAbsenceReason]=useState<"ABSENT"|"EXCUSED"|"MEDICAL"|"LATE">("ABSENT");
  const [correctionNote,setCorrectionNote]=useState("");
  const [verifiedRecord,setVerifiedRecord]=useState<{
    status:"PRESENT"|"ABSENT"|"EXCUSED"|"MEDICAL"|"LATE";
    note:string|null;expectedMarkedAt:string|null;
  }|null>(null);
  const noteEdited=verifiedRecord!==null&&adminAttendanceCorrectionChange({
    previous:{status:verifiedRecord.status,note:verifiedRecord.note},
    requestedStatus:verifiedRecord.status,requestedNote:correctionNote,
  }).noteChanged;
  const [verifyingRecord,setVerifyingRecord]=useState(false);
  const recordRequest=useRef(0);
  const [sectionId, setSectionId] = useState(data.selectedSectionId ?? "");
  const [courseId, setCourseId] = useState(data.selectedCourseId ?? "");
  const [deliveryId,setDeliveryId]=useState(data.selectedDeliveryId??"");
  const [showAllCourses, setShowAllCourses] = useState(data.showAllCourses);
  const [chooser, setChooser] = useState<{
    learner: Learner; sessions: Session[];
  } | null>(null);

  // Keep the controls aligned with URL changes (month navigation/back/forward)
  // by adjusting state while rendering, the supported alternative to an effect.
  const syncKey = [
    data.selectedSectionId,
    data.selectedCourseId,
    data.selectedDeliveryId,
    data.showAllCourses,
    data.month,
  ].join("|");
  const [syncedKey, setSyncedKey] = useState(syncKey);
  if (syncKey !== syncedKey) {
    setSyncedKey(syncKey);
    setSectionId(data.selectedSectionId ?? "");
    setCourseId(data.selectedCourseId ?? "");
    setDeliveryId(data.selectedDeliveryId??"");
    setShowAllCourses(data.showAllCourses);
    recordRequest.current+=1;
    setTarget(null);
    setVerifiedRecord(null);
    setChooser(null);
  }

  const classes = useMemo(() =>
    [...new Map(data.deliveries.map((item) => [item.sectionId, item])).values()],
    [data.deliveries],
  );
  const offeredCourses = useMemo(() => {
    const ids = new Set(
      data.deliveries.filter((delivery) => delivery.sectionId === sectionId)
        .map((delivery) => delivery.courseId),
    );
    return data.courses.filter((course) => ids.has(course.id));
  }, [data.courses, data.deliveries, sectionId]);
  const visibleCourses = showAllCourses ? data.courses : offeredCourses;
  const termDeliveries=data.deliveries.filter(row=>row.sectionId===sectionId && row.courseId===courseId);
  // Retain only the last successful read for the same college, delivery,
  // class, course and month. Cross-college or cross-filter snapshots must never
  // be rendered after a failed server read.
  const gridScopeKey=[
    data.collegeId,data.selectedSectionId??"",data.selectedCourseId??"",
    data.selectedDeliveryId??"",data.month,
  ].join("|");
  const [lastGrid,setLastGrid]=useState<{
    scope:string;value:NonNullable<AdminAttendanceWorkspaceData["grid"]>;
  }|null>(()=>data.grid?{scope:gridScopeKey,value:data.grid}:null);
  useEffect(()=>{
    if(data.grid)setLastGrid({scope:gridScopeKey,value:data.grid});
  },[gridScopeKey,data.grid]);
  const viewGrid=data.grid??(data.gridLookupFailed && lastGrid?.scope===gridScopeKey
    ?lastGrid.value:null);

  const sessionDays = useMemo(() =>
    attendanceMonthDays(data.month,viewGrid?.sessions ?? []),
    [viewGrid?.sessions,data.month],
  );

  function navigate(
    month = data.month, nextSectionId = sectionId, nextCourseId = courseId,
    nextDeliveryId = deliveryId, nextShowAllCourses = showAllCourses,
  ) {
    const params = new URLSearchParams({ month });
    if (nextSectionId) params.set("sectionId", nextSectionId);
    if (nextCourseId) params.set("courseId", nextCourseId);
    const choices=data.deliveries.filter(row=>row.sectionId===nextSectionId && row.courseId===nextCourseId);
    const selected=choices.find(row=>row.deliveryId===nextDeliveryId)??choices[0];
    if(selected)params.set("deliveryId",selected.deliveryId);
    if (nextShowAllCourses) params.set("allCourses", "1");
    startRefresh(()=>router.push(basePath + "?" + params.toString()));
  }

  const recordMap = useMemo(
    () =>
      new Map(
        (viewGrid?.records ?? []).map(
          (record) => [
            `${record.scheduleEventId}:${record.membershipId}`,
            record,
          ],
        ),
      ),
    [viewGrid?.records],
  );

  // Held status must update if a scheduled class begins while this page is open.
  const [loadedAt,setLoadedAt] = useState(() => Date.now());
  useEffect(()=>{
    const timer=window.setInterval(()=>setLoadedAt(Date.now()),60_000);
    return ()=>window.clearInterval(timer);
  },[]);
  const heldSessions = useMemo(
    () =>
      (viewGrid?.sessions ?? []).filter(
        (session) => new Date(session.startsAt).getTime() <= loadedAt,
      ),
    [viewGrid?.sessions, loadedAt],
  );

  const markedSessions=heldSessions.filter(session=>session.attendanceStatus==="MARKED");
  // Count only authorized visible learners and their individually marked sessions.
  const totalMarks=(viewGrid?.roster??[]).reduce((sum,learner)=>sum+
    heldSessions.filter(session=>adminAttendanceCellState(session,
      recordMap.get(session.id+":"+learner.membershipId)).counted).length,0);
  const presentMarks=(viewGrid?.roster??[]).reduce((sum,learner)=>sum+
    heldSessions.filter(session=>adminAttendanceCellState(session,
      recordMap.get(session.id+":"+learner.membershipId)).present).length,0);
  const absentMarks=totalMarks-presentMarks;
  const monthPercent=totalMarks>0?Math.round(100*presentMarks/totalMarks):null;
  const activeDays=new Set(heldSessions.map(session=>attendanceIndiaDay(session.startsAt))).size;
  const notMarkedCount=heldSessions.length-markedSessions.length;

  function learnerPercent(learner: Learner) {
    return adminAttendancePercent(
      learner.membershipId, viewGrid?.sessions ?? [], viewGrid?.records ?? [],
    );
  }

  function dailyMarkedRatio(learner: Learner, sessions: Session[]) {
    return adminAttendanceDayRatio(
      learner.membershipId, sessions, viewGrid?.records ?? [],
    );
  }

  function openCorrectionTarget(next:CellTarget){
    const requestId=++recordRequest.current;
    setTarget(next);
    setVerifiedRecord(null);
    setVerifyingRecord(true);
    setAbsenceReason("ABSENT");
    setCorrectionNote("");
    setError(null);
    const params=new URLSearchParams({
      collegeId:data.collegeId,
      deliveryId:data.selectedDeliveryId??"",
      scheduleEventId:next.session.id,
      membershipId:next.learner.membershipId,
    });
    void apiFetch<{
      status:"PRESENT"|"ABSENT"|"EXCUSED"|"MEDICAL"|"LATE";
      note:string|null;expectedMarkedAt:string|null;
    }>("/api/attendance/admin/current-record?"+params.toString()).then(current=>{
      if(recordRequest.current!==requestId)return;
      setVerifiedRecord(current);
      setCorrectionNote(current.note??"");
      if(current.status!=="PRESENT")setAbsenceReason(current.status);
    }).catch(cause=>{
      if(recordRequest.current!==requestId)return;
      setError(cause instanceof Error?cause.message:
        "Could not verify the current attendance record. Refresh and try again.");
    }).finally(()=>{
      if(recordRequest.current===requestId)setVerifyingRecord(false);
    });
  }

  async function correct(
    status:
      | "PRESENT"
      | "ABSENT"
      | "EXCUSED"
      | "MEDICAL"
      | "LATE",
  ) {
    return correctionGuard.run(async()=>{
    if (
      !target ||
      !data.selectedDeliveryId ||
      correcting || verifyingRecord || !verifiedRecord ||
      new Date(target.session.startsAt).getTime()>loadedAt ||
      !adminAttendanceCorrectionChange({
        previous:{status:verifiedRecord.status,note:verifiedRecord.note},
        requestedStatus:status,requestedNote:correctionNote,
      }).changed
    ) {
      return;
    }
    setError(null);
    setCorrecting(true);
    try {
      await apiFetch<void>(
        `/api/attendance/admin/sessions/${encodeURIComponent(target.session.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            collegeId: data.collegeId,
            deliveryId: data.selectedDeliveryId,
            membershipId: target.learner.membershipId,
            status,
            expectedMarkedAt:verifiedRecord.expectedMarkedAt,
            note: correctionNote.trim(), // empty string explicitly clears a saved note
          }),
        },
      );
      setNotice("Attendance corrected for "+learnerName(target.learner)+" · "+
        (status==="PRESENT"?"Present":status==="ABSENT"?"Absent":status.toLowerCase()));
      recordRequest.current+=1;
      setVerifiedRecord(null);
      setTarget(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof FriendlyFetchError && cause.status===409
        ? "This changed while you were working. Refresh the attendance grid and re-apply the correction."
        :cause instanceof Error ? cause.message
        : "Attendance correction failed. Check your connection and retry.");
    } finally {
      setCorrecting(false);
    }
    });
  }

  function exportCsv() {
    if (!viewGrid) return;
    // One column per IST calendar day, so the file remains usable in the
    // legacy monthly grid. Multiple sessions on a date are slash-delimited.
    const header = ["Student",...sessionDays.map(row=>String(Number(row.day.slice(-2))))];
    const rows = viewGrid.roster.map(learner=>[
      learnerName(learner),
      ...sessionDays.map(({sessions})=>{
        if(sessions.length===0)return "";
        const ratio=dailyMarkedRatio(learner,sessions);
        if(sessions.length>1)return ratio.counted
          ?ratio.attended+"/"+ratio.counted:"N";
        const state=codeFor(sessions[0]!,recordMap.get(sessions[0]!.id+":"+learner.membershipId));
        return state.code==="P"?"P":(["A","E","M","L"].includes(state.code)?"A":"N");
      }),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(attendanceCsvCell).join(","))
      .join("\r\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-class-${viewGrid.delivery.sectionCode}-course-${viewGrid.delivery.courseCode}-${data.month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-5)]">
      {notice?<div role="status"><Alert tone="info">{notice}</Alert></div>:null}
      {refreshing?<p role="status" className="text-sm text-body">Refreshing attendance…</p>:null}
      {data.gridLookupFailed&&viewGrid?<Alert tone="warning">The monthly attendance refresh failed. Displaying only the last verified grid for this same college, class, course and month. <Button type="button" variant="secondary" size="sm" disabled={refreshing} onClick={()=>startRefresh(()=>router.refresh())}>Retry attendance</Button></Alert>:null}

      <section aria-label="Attendance policy" className="min-w-0 border-b border-border pb-4">
      <h2 className="mb-3 text-base font-semibold text-foreground">Attendance policy</h2>
      <section className="grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
        <div className="border-b border-border pb-4">
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {data.policy.correctionWindowHours} hours
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Read-only Faculty marking window. College Admin corrections may also be made outside this window.
          </p>
        </div>
        <div className="border-b border-border pb-4">
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

      </section>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate();
        }}
        className="grid min-w-0 items-end gap-[var(--lms-space-4)] border-b border-border pb-[var(--lms-space-4)] md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Class
          <Select className="w-full" value={sectionId}
            onChange={(event) => {
              setSectionId(event.target.value);
              setCourseId("");setDeliveryId("");
              navigate(data.month,event.target.value,"","");
            }}>
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.sectionId} value={item.sectionId}>
                {item.sectionName} · {item.sectionCode}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Course
          <Select className="w-full" value={courseId}
            disabled={!sectionId}
            onChange={(event) => {setCourseId(event.target.value);setDeliveryId("");
              navigate(data.month,sectionId,event.target.value,"");}}>
            <option value="">Select course</option>
            {visibleCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} · {course.name}
                {data.deliveries.some(row=>row.sectionId===sectionId&&row.courseId===course.id&&row.offeringType==="ELECTIVE")
                  ?" (elective)":""}
                {!offeredCourses.some((item) => item.id === course.id)
                  ? " (not taught to this class)" : ""}
              </option>
            ))}
          </Select>
        </label>
        {termDeliveries.length>1?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Academic term
          <Select className="w-full" value={deliveryId||termDeliveries[0]?.deliveryId||""}
            onChange={event=>{setDeliveryId(event.target.value);navigate(data.month,sectionId,courseId,event.target.value);}}>
            {termDeliveries.map(item=><option key={item.deliveryId} value={item.deliveryId}>
              {item.academicPeriodName} · {item.sectionName}{item.isPast?" · past":""}{item.offeringType==="ELECTIVE"?" (elective)":""}
            </option>)}
          </Select>
        </label>:null}
        <Button type="button" variant="ghost"
          className="min-h-11 justify-self-start px-0 text-sm font-semibold text-primary-text underline underline-offset-2 md:col-span-2 md:min-h-9 xl:col-span-3"
          onClick={() => {
            const next=!showAllCourses;
            setShowAllCourses(next);
            const validCourse=next || offeredCourses.some(item=>item.id===courseId);
            if(!validCourse)setCourseId("");
            navigate(data.month,sectionId,validCourse?courseId:"",validCourse?deliveryId:"",next);
          }}>{showAllCourses?"Only courses taught to this class":"Show all college courses"}</Button>
        <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] md:col-span-2 md:flex-row md:flex-wrap md:items-center md:justify-between xl:col-span-3">
          <div className="flex min-w-0 items-center justify-between gap-[var(--lms-space-2)] md:justify-start flex-wrap">
            <Button size="sm" variant="secondary"
              aria-label="Previous month"
              type="button" onClick={() => navigate(shiftAttendanceMonth(data.month, -1))}>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </Button>
            <span className="min-w-0 text-center text-sm font-semibold text-body" aria-live="polite">{attendanceMonthLabel(data.month)}</span>
            <Button size="sm" variant="secondary"
              aria-label="Next month"
              type="button" onClick={() => navigate(shiftAttendanceMonth(data.month, 1))}>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </Button>
          </div>
          <Input className="min-w-0 w-full md:max-w-40" type="month" aria-label="Attendance month"
            value={data.month}
            onChange={(event) => {
              if (event.target.value) navigate(event.target.value);
            }} />
        </div>
        <Button size="sm" variant="secondary" type="button" disabled={!viewGrid||refreshing||data.gridLookupFailed}
          onClick={exportCsv}>Export CSV</Button>
      </form>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" variant="secondary" disabled={refreshing} onClick={()=>startRefresh(()=>router.refresh())}>
          {refreshing?"Refreshing attendance…":"Refresh attendance"}
        </Button>
      </div>

      {data.gridLookupFailed && !viewGrid ? (
        <div role="alert" className="min-w-0 space-y-3 border-b border-border pb-4">
          <p className="text-sm font-semibold text-error">Couldn't load monthly attendance</p>
          <p className="text-sm text-body">The attendance grid could not be refreshed. The selected class, course and month are unchanged.</p>
          <Button type="button" variant="secondary" disabled={refreshing}
            onClick={()=>startRefresh(()=>router.refresh())}>Retry attendance</Button>
        </div>
      ) : data.deliveries.length === 0 ? (
        <EmptyState
          title="No assigned class courses"
          description="There are no active class/course deliveries for this college yet."
        />
      ) : !viewGrid ? (
        <EmptyState
          title={sectionId && courseId ? "Course is not taught to this class" : "Select a class and course"}
          description={sectionId && courseId
            ? "Choose a course taught to this class to view attendance records."
            : "Choose a class, an offered course, and a month to review attendance."}
        />
      ) : viewGrid.roster.length === 0 ? (
        <EmptyState
          title="No active learners in this class"
          description="Attendance records require an active learner roster for this delivery."
        />
      ) : viewGrid.sessions.length === 0 ? (
        <EmptyState
          title="No attendance data for this class, course and month"
          description="No class sessions are scheduled for the selected Course delivery in this month."
        />
      ) : (
        <>
          <section className="border-b border-border pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                  Monthly class health
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  {viewGrid.delivery.sectionName} ·{" "}
                  {viewGrid.delivery.courseName}
                </h2>
                <p className="mt-1 text-sm text-body">
                  {
                    viewGrid.sessions.filter(
                      (session) =>
                        session.attendanceStatus ===
                        "MARKED",
                    ).length
                  }{" "}
                  of {heldSessions.length} held sessions marked
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground" aria-label="Monthly attendance percentage">{monthPercent===null?"—":monthPercent+"%"}</p>
                <dl className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-2 sm:grid-cols-4 gap-[var(--lms-space-3)] text-xs text-body">
                  <div><dt>Students</dt><dd className="text-lg font-semibold">{viewGrid.roster.length}</dd></div>
                  <div><dt>Sessions held</dt><dd className="text-lg font-semibold">{heldSessions.length}</dd></div>
                  <div><dt>Active days</dt><dd className="text-lg font-semibold">{activeDays}</dd></div>
                  <div><dt>Absences</dt><dd className="text-lg font-semibold">{absentMarks}</dd></div>
                  {notMarkedCount>0?<div><dt>Not marked</dt><dd className="text-base font-semibold">{notMarkedCount}</dd></div>:null}
                </dl>
                <p className="mt-2 text-xs text-body">{presentMarks} present records across {heldSessions.length} held sessions</p>
              </div>
            </div>
          </section>

          <section className="min-w-0">
          <p className="mb-3 text-xs leading-5 text-muted-foreground">
            P = Present · A = Absent · E = Excused · M = Medical · L = Late · N = not marked · X = no class · S = future.
            Multiple sessions on a day open a session chooser.
          </p>
            <Table scrollLabel="College attendance monthly grid">
              <caption className="sr-only">College attendance for every calendar day of the selected month. Cross means no scheduled class.</caption>
              <thead>
                <tr>
                  <th rowSpan={2} scope="col" className="sticky left-0 z-20 bg-surface px-4 text-left">Student</th>
                  {sessionDays.map(({day,weekday,isSunday,sessions})=>(
                    <th key={"weekday-"+day} scope="col"
                      className={"min-w-16 px-2 py-2 text-center text-xs font-semibold "+(isSunday?"bg-surface-subtle":"")}
                      title={sessions.length?String(sessions.length)+" sessions":"No class scheduled"}>{weekday}</th>
                  ))}
                  <th rowSpan={2} scope="col" className="px-4 text-center"
                    aria-label={ADMIN_ATTENDANCE_COPY.monthPercentAria}
                    title={ADMIN_ATTENDANCE_COPY.monthPercentTooltip}>{ADMIN_ATTENDANCE_COPY.monthPercentHeader}</th>
                </tr>
                <tr>
                  {sessionDays.map(({day,isSunday})=>(
                    <th key={"day-"+day} scope="col"
                      className={"min-w-16 px-2 py-2 text-center text-sm font-semibold "+(isSunday?"bg-surface-subtle":"")}>
                      {day.slice(8)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewGrid.roster.map(
                  (learner) => {
                    const percent =
                      learnerPercent(learner);
                    return (
                      <tr
                        key={
                          learner.membershipId
                        }
                      >
                        <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-3">
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
                        </th>
                        {sessionDays.map(({ day, sessions, isSunday }) => {
                          if(!sessions.length)return <td key={day} className={"px-2 py-3 text-center "+(isSunday?"bg-surface-subtle":"")}><span aria-label="No class scheduled" className="text-muted-foreground">✖</span></td>;
                          const first = sessions[0]!;
                          const record = recordMap.get(first.id + ":" + learner.membershipId);
                          const state = codeFor(first, record);
                          const multiple = sessions.length > 1;
                          const ratio=multiple?dailyMarkedRatio(learner,sessions):null;
                          return (
                            <td key={day} className="px-3 py-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={sessions.every(session=>new Date(session.startsAt).getTime()>loadedAt)}
                                aria-label={multiple
                                  ? (ratio?.counted
                                    ? ratio.attended + " of " + ratio.counted + " marked sessions attended"
                                    : "Attendance not marked") + " — " + learnerName(learner) + " — " + day
                                  : state.label + " — " + learnerName(learner) + " — " + formatDateTime(first.startsAt)}
                                onClick={() => {
                                  if (multiple) setChooser({ learner, sessions });
                                  else openCorrectionTarget({ learner, session: first, record });
                                }}
                                title={!multiple && new Date(first.startsAt).getTime()>loadedAt ? "This class has not started. Attendance can be corrected after it begins." : undefined}
                                className="min-h-11 border-transparent bg-transparent px-1 text-body disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
                              >
                                <StatusBadge tone={multiple ? "neutral" : state.tone}>
                                  {multiple ? (ratio?.counted
                                    ? ratio.attended+"/"+ratio.counted
                                    : "N") : state.code}
                                </StatusBadge>
                              </Button>
                            </td>
                          );
                        })}
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
            </Table>
          </section>

          <p className="text-xs leading-5 text-muted-foreground">
            N = not marked · X = no class. College Admin may correct sessions after the Faculty window closes.
          </p>
        </>
      )}

      <AdminAttendanceParentContactEditor collegeId={data.collegeId} learners={viewGrid?.roster??[]}/>

      <Modal
        open={Boolean(target)}
        dismissible={!correcting&&!correctionGuard.pending}
        onOpenChange={(open) => {
          if (!open && !correcting && !correctionGuard.pending) {
            recordRequest.current+=1;
            setTarget(null);
            setVerifiedRecord(null);
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
        {...(target ? {description: `${target.session.title} · ${formatDateTime(target.session.startsAt)}`} : {})}
        footer={
          target ? (
            <div className="grid w-full min-w-0 grid-cols-1 md:grid-cols-2 gap-[var(--lms-space-2)] [&>button]:min-h-11 [&>button:last-child]:col-span-2 sm:flex sm:flex-wrap sm:justify-end sm:[&>button:last-child]:col-span-1 sm:[&>button]:min-h-[var(--lms-control-height)]">
              {!verifiedRecord && !verifyingRecord ? (
                <Button size="sm" variant="secondary" disabled={correcting||refreshing}
                  onClick={()=>openCorrectionTarget(target)}>Retry record</Button>
              ) : null}
              <Button size="sm" variant="secondary" disabled={correcting||refreshing||verifyingRecord}
                onClick={()=>{recordRequest.current+=1;setTarget(null);setVerifiedRecord(null);startRefresh(()=>router.refresh());}}>Refresh grid and reopen</Button>
              {noteEdited && verifiedRecord ? (
                <Button size="sm" variant="secondary"
                  disabled={correcting||refreshing||verifyingRecord}
                  onClick={()=>void correct(verifiedRecord.status)}>
                  {correcting?"Saving…":"Save note"}
                </Button>
              ) : null}
              {verifiedRecord && verifiedRecord.status !== "PRESENT" &&
                absenceReason !== verifiedRecord.status ? (
                <Button size="sm" variant="secondary"
                  disabled={correcting||refreshing||verifyingRecord}
                  onClick={()=>void correct(absenceReason)}>
                  {correcting?"Saving…":"Update reason"}
                </Button>
              ) : null}
              {verifiedRecord?.status && verifiedRecord.status !== "PRESENT" ? (
                <Button size="sm" disabled={correcting||refreshing||verifyingRecord||!verifiedRecord} onClick={()=>void correct("PRESENT")}>
                  {correcting?"Saving…":"Mark present"}
                </Button>
              ) : (
                <Button size="sm" variant="danger" disabled={correcting||refreshing||verifyingRecord||!verifiedRecord} onClick={()=>void correct(absenceReason)}>
                  {correcting?"Saving…":"Mark absent"}
                </Button>
              )}
            </div>
          ) : null
        }
      >
        {target ? (
          <div className="min-w-0 space-y-[var(--lms-space-4)] text-sm">
            <div className="border-b border-border pb-[var(--lms-space-4)]">
              <p className="font-semibold text-foreground">
                Current status
              </p>
              <p className="mt-1 text-body">
                {verifyingRecord?"Verifying current attendance…":
                  verifiedRecord?.status??"Current record could not be verified"}
              </p>
            </div>
            {verifiedRecord ? (
              <fieldset disabled={correcting||refreshing||verifyingRecord} className="space-y-2">
                <legend className="text-sm font-semibold text-body">Attendance reason</legend>
                <div className="flex flex-wrap gap-4">
                  {([["ABSENT","Absent"],["EXCUSED","Excused"],["MEDICAL","Medical"],["LATE","Late"]] as const).map(([value,label])=>
                    <label key={value} className="inline-flex min-h-11 items-center gap-2 text-sm">
                      <input type="radio" name="attendance-absence-reason" value={value}
                        checked={absenceReason===value} onChange={()=>setAbsenceReason(value)}
                        className="size-4 accent-[var(--lms-primary)]"/>
                      {label}
                    </label>
                  )}
                </div>
              </fieldset>
            ) : null}
            <label className="grid gap-[6px] text-sm font-semibold text-body">
              Correction note (optional)
              <Input maxLength={500} value={correctionNote} disabled={correcting||refreshing}
                onChange={event=>setCorrectionNote(event.target.value)} />
            </label>
            <p className="text-xs text-muted-foreground">The current attendance record is re-read from the selected college immediately before editing. A changed record is rejected on save; refresh and retry to avoid overwriting someone else&apos;s correction.</p>
            <p className="text-xs text-muted-foreground">
              The Faculty correction window is {data.policy.correctionWindowHours} hours. College Admin corrections are not limited by it. Present corrections retain the learner’s attendance record and correction history. Note edits are also recorded.
            </p>
            {target.record?.note ? (
              <p className="text-sm text-body">Note: {target.record.note}</p>
            ) : null}
            {target.record?.markedAt || target.session.attendanceMarkedAt ? (
            <dl className="grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
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
            ) : null}
            {verifyingRecord?<p role="status" className="text-sm text-muted-foreground">Verifying record and permissions…</p>:null}
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
      </Modal>
      <Modal
        open={Boolean(chooser)}
        onOpenChange={(open) => { if (!open) setChooser(null); }}
        title={chooser ? "Choose a session — " + learnerName(chooser.learner) : "Choose a session"}
        description="Only the session you open will be corrected."
      >
        <div className="space-y-3">
          {chooser?.sessions.map((session) => {
            const record = recordMap.get(session.id + ":" + chooser.learner.membershipId);
            const state = codeFor(session, record);
            return (
              <Button
                key={session.id}
                variant="secondary"
                disabled={new Date(session.startsAt).getTime()>loadedAt}
                title={new Date(session.startsAt).getTime()>loadedAt?"This class has not started. Attendance can be corrected after it begins.":undefined}
                className="w-full min-w-0 justify-between gap-[var(--lms-space-2)] text-left whitespace-normal break-words"
                onClick={() => {
                  openCorrectionTarget({ learner: chooser.learner, session, record });
                  setChooser(null);
                }}
              >
                <span>{session.title} · {formatDateTime(session.startsAt)}</span>
                <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
              </Button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
