"use client";

import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";

import {
  adminAttendanceCellState,
  adminAttendancePercent,
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
  const correctionGuard=useGuardedAction({busyLabel:"Correcting attendance..."});
  const [target, setTarget] =
    useState<CellTarget | null>(null);
  const [correcting, setCorrecting] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [notice,setNotice]=useState<string|null>(null);
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
    setTarget(null);
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
  const sessionDays = useMemo(() =>
    attendanceMonthDays(data.month,data.grid?.sessions ?? []),
    [data.grid?.sessions,data.month],
  );

  function navigate(month = data.month) {
    const params = new URLSearchParams({ month });
    if (sectionId) params.set("sectionId", sectionId);
    if (courseId) params.set("courseId", courseId);
    const selected=termDeliveries.find(row=>row.deliveryId===deliveryId)??termDeliveries[0];
    if(selected)params.set("deliveryId",selected.deliveryId);
    if (showAllCourses) params.set("allCourses", "1");
    router.push(basePath + "?" + params.toString());
  }

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

  // Captured once per mount: "held" only needs to be accurate to the page load.
  const [loadedAt] = useState(() => Date.now());
  const heldSessions = useMemo(
    () =>
      (data.grid?.sessions ?? []).filter(
        (session) => new Date(session.startsAt).getTime() <= loadedAt,
      ),
    [data.grid?.sessions, loadedAt],
  );

  const markedSessions=heldSessions.filter(session=>session.attendanceStatus==="MARKED");
  const markedIds=new Set(markedSessions.map(session=>session.id));
  const absentMarks=(data.grid?.records??[]).filter(record=>
    markedIds.has(record.scheduleEventId)&&record.status!=="PRESENT").length;
  const totalMarks=markedSessions.length*(data.grid?.roster.length??0);
  const presentMarks=Math.max(0,totalMarks-absentMarks);
  const monthPercent=totalMarks>0?Math.round(100*presentMarks/totalMarks):null;
  const activeDays=new Set(heldSessions.map(session=>attendanceIndiaDay(session.startsAt))).size;
  const notMarkedCount=heldSessions.length-markedSessions.length;

  function learnerPercent(learner: Learner) {
    return adminAttendancePercent(
      learner.membershipId, data.grid?.sessions ?? [], data.grid?.records ?? [],
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
    return correctionGuard.run(async()=>{
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
          }),
        },
      );
      setNotice("Attendance corrected for "+learnerName(target.learner)+" — "+target.session.title+".");
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
    if (!data.grid) return;
    // One column per IST calendar day, so the file remains usable in the
    // legacy monthly grid. Multiple sessions on a date are slash-delimited.
    const header = ["Learner","Roll",...sessionDays.map(row=>row.day),"Attendance %"];
    const rows = data.grid.roster.map(learner=>[
      learnerName(learner),learner.rollNumber??"",
      ...sessionDays.map(({sessions})=>{
        if(sessions.length===0)return "✖";
        return sessions.map(session=>{
          const state=codeFor(session,recordMap.get(session.id+":"+learner.membershipId));
          if(state.code==="P")return "P";
          if(["A","E","M","L"].includes(state.code))return "A";
          return "N";
        }).join("/");
      }),
      learnerPercent(learner)??"",
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
    link.download = `attendance-${data.grid.delivery.sectionCode}-${data.grid.delivery.courseCode}-${data.month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {notice?<p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm font-semibold text-body">{notice}</p>:null}
      <AdminAttendanceParentContactEditor collegeId={data.collegeId} learners={data.grid?.roster??[]}/>
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="border-b border-border pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Retroactive marking window
          </p>
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

      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate();
        }}
        className="grid gap-3 border-b border-border pb-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]"
      >
        <label className="text-xs font-semibold text-body">
          Class
          <Select className="mt-1.5" value={sectionId}
            onChange={(event) => {
              setSectionId(event.target.value);
              setCourseId("");setDeliveryId("");
            }}>
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.sectionId} value={item.sectionId}>
                {item.sectionName} · {item.sectionCode}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs font-semibold text-body">
          Course
          <Select className="mt-1.5" value={courseId}
            disabled={!sectionId}
            onChange={(event) => {setCourseId(event.target.value);setDeliveryId("");}}>
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
        {termDeliveries.length>1?<label className="text-xs font-semibold text-body">
          Academic term
          <Select className="mt-1.5" value={deliveryId||termDeliveries[0]?.deliveryId||""}
            onChange={event=>setDeliveryId(event.target.value)}>
            {termDeliveries.map(item=><option key={item.deliveryId} value={item.deliveryId}>
              {item.academicPeriodName} · {item.sectionName}{item.isPast?" · past":""}{item.offeringType==="ELECTIVE"?" (elective)":""}
            </option>)}
          </Select>
        </label>:null}
        <Button className="self-end" type="submit" disabled={!sectionId || !courseId}>
          View attendance
        </Button>
        <label className="flex items-center gap-2 text-sm text-body md:col-span-2 xl:col-span-3">
          <input
            type="checkbox"
            checked={showAllCourses}
            onChange={(event) => {
              setShowAllCourses(event.target.checked);
              if (!event.target.checked && !offeredCourses.some((item) => item.id === courseId)) {
                setCourseId("");
              }
            }}
          />
          Show all college courses (including courses not taught to this class)
        </label>
        <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-3">
          <Button size="sm" variant="secondary"
            aria-label="Previous month"
            onClick={() => navigate(shiftAttendanceMonth(data.month, -1))}>
            Previous
          </Button>
          <span className="min-w-32 text-center text-sm font-semibold text-body" aria-live="polite">{attendanceMonthLabel(data.month)}</span>
          <Input className="max-w-40" type="month" aria-label="Attendance month"
            value={data.month}
            onChange={(event) => {
              if (event.target.value) navigate(event.target.value);
            }} />
          <Button size="sm" variant="secondary"
            aria-label="Next month"
            onClick={() => navigate(shiftAttendanceMonth(data.month, 1))}>
            Next
          </Button>
        </div>
      </form>

      {data.deliveries.length === 0 ? (
        <EmptyState
          title="No assigned class courses"
          description="There are no active class/course deliveries for this college yet."
        />
      ) : !data.grid ? (
        <EmptyState
          title={sectionId && courseId ? "Course is not taught to this class" : "Select a class and course"}
          description={sectionId && courseId
            ? "Choose a course taught to this class to view attendance records."
            : "Choose a class, an offered course, and a month to review attendance."}
        />
      ) : data.grid.roster.length === 0 ? (
        <EmptyState
          title="No active learners in this class"
          description="Attendance records require an active learner roster for this delivery."
        />
      ) : data.grid.sessions.length === 0 ? (
        <EmptyState
          title="No attendance data for this month"
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
                <dl className="mt-3 grid gap-2 text-xs text-body sm:grid-cols-3 lg:grid-cols-5">
                  <div><dt>Monthly attendance</dt><dd className="font-semibold">{monthPercent===null?"—":monthPercent+"%"}</dd></div>
                  <div><dt>Students</dt><dd className="font-semibold">{data.grid.roster.length}</dd></div>
                  <div><dt>Sessions held</dt><dd className="font-semibold">{heldSessions.length}</dd></div>
                  <div><dt>Absences</dt><dd className="font-semibold">{absentMarks}</dd></div>
                  <div><dt>Active days</dt><dd className="font-semibold">{activeDays}</dd></div>
                  <div><dt>Not marked</dt><dd className="font-semibold">{notMarkedCount}</dd></div>
                </dl>
                <p className="mt-2 text-xs text-body">{presentMarks} present marks across {markedSessions.length} marked sessions</p>
              </div>
              <Button
                variant="secondary"
                onClick={exportCsv}
              >
                Export CSV
              </Button>
            </div>
          </section>

          <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface">
              <ScrollCue axis="x" label="College attendance monthly grid" className="min-w-0">
            <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
              <caption className="sr-only">College attendance for every calendar day of the selected month. Cross means no scheduled class.</caption>
              <thead className="bg-surface-subtle text-xs uppercase tracking-[0.06em] text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-20 bg-surface-subtle px-4 py-3">
                    Learner
                  </th>
                  {sessionDays.map(({ day, sessions, weekday, isSunday }) => (
                    <th key={day} scope="col" className={"min-w-16 px-2 py-3 text-center "+(isSunday?"bg-surface-subtle":"")}
                      title={sessions.length?String(sessions.length) + " session(s)":"No class scheduled"}>
                      <span className="block">{day.slice(8)}</span><span className="block text-xs font-normal">{weekday}</span>
                      {sessions.length > 1 ? (
                        <span className="block text-[11px] normal-case">
                          {sessions.length} sessions
                        </span>
                      ) : null}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center"
                    aria-label={ADMIN_ATTENDANCE_COPY.monthPercentAria}
                    title={ADMIN_ATTENDANCE_COPY.monthPercentTooltip}>
                    {ADMIN_ATTENDANCE_COPY.monthPercentHeader}
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
                        {sessionDays.map(({ day, sessions, isSunday }) => {
                          if(!sessions.length)return <td key={day} className={"px-2 py-3 text-center "+(isSunday?"bg-surface-subtle":"")}><span aria-label="No class scheduled" className="text-muted-foreground">✖</span></td>;
                          const first = sessions[0]!;
                          const record = recordMap.get(first.id + ":" + learner.membershipId);
                          const state = codeFor(first, record);
                          const multiple = sessions.length > 1;
                          return (
                            <td key={day} className="px-3 py-3 text-center">
                              <Button variant="ghost"
                                type="button"
                                disabled={!multiple && new Date(first.startsAt).getTime() > loadedAt}
                                aria-label={multiple
                                  ? String(sessions.length) + " sessions on " + day + " for " + learnerName(learner)
                                  : state.label + " — " + learnerName(learner) + " — " + formatDateTime(first.startsAt)}
                                onClick={() => {
                                  if (multiple) setChooser({ learner, sessions });
                                  else setTarget({ learner, session: first, record });
                                }}
                                title={!multiple && new Date(first.startsAt).getTime()>loadedAt ? "This class has not started. Attendance can be corrected after it begins." : undefined}
                                className="disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary"
                              >
                                <StatusBadge tone={multiple ? "neutral" : state.tone}>
                                  {multiple ? String(sessions.length) + " sessions" : state.code}
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
            P = Present · A = Absent · E = Excused · M = Medical · L = Late · — = not marked · S = future. Multiple sessions on a day open a session chooser. College Admin may correct sessions after the Faculty window closes.
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
            <div className="rounded-[var(--lms-control-radius)] bg-surface-subtle p-4">
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
            <p className="text-xs text-muted-foreground">
              The Faculty correction window is {data.policy.correctionWindowHours} hours. College Admin corrections are not limited by it. Present corrections remove the absence exception. This change is recorded.
            </p>
            {target.record?.note ? (
              <p className="text-sm text-body">Note: {target.record.note}</p>
            ) : null}
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
      <Drawer
        open={Boolean(chooser)}
        onOpenChange={(open) => { if (!open) setChooser(null); }}
        title="Choose attendance session"
        description={chooser ? learnerName(chooser.learner) : undefined}
      >
        <div className="space-y-3">
          {chooser?.sessions.map((session) => {
            const record = recordMap.get(session.id + ":" + chooser.learner.membershipId);
            const state = codeFor(session, record);
            return (
              <Button
                key={session.id}
                variant="secondary"
                className="w-full justify-between"
                onClick={() => {
                  setTarget({ learner: chooser.learner, session, record });
                  setChooser(null);
                }}
              >
                <span>{session.title} · {formatDateTime(session.startsAt)}</span>
                <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
              </Button>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
}
