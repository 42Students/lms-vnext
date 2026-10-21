import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Alert, Card, Select, Button, Empty, Spin, message, Modal, Descriptions,
  Tag, Radio, Typography, Space,
} from "antd";
import PolicySettingField from "@/components/admin/PolicySettingField";
import { LeftOutlined, RightOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getClassesByCollege, getCoursesByCollege, adminMarkAbsent, adminMarkPresent,
  adminGetAttendanceRecord,
} from "@/api/Services/AdminService";
import { getAdminAttendanceMonthlyGrid } from "@/api/Services/attendanceServices";
import { DAYS_OF_WEEK } from "@/utils/attendanceConstants";
import { exportRowsToCsv } from "@/utils/csvExport";
import { formatTimestamp, statusLabel } from "@/components/admin/projects/adminProjectUtils";
import { getAttendanceDay, isSessionAbsent, isSessionCounted, sessionIdOf } from "@/utils/adminAttendanceGrid";
import { getAssignmentsByClass } from "@/api/Services/FacultyAssignmentService";
import { DetailSkeleton, RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";

const dayKey = (index) => String(index).padStart(2, "0");
const isHeld = (session, now) => !session?.startTime || !dayjs(session.startTime).isAfter(now);
const dayFor = (classesByDay, key, absentIds, now) =>
  getAttendanceDay(classesByDay?.[key], absentIds, (session) => isHeld(session, now));
const heldSessions = (classesByDay, now) => Object.values(classesByDay ?? {}).flat()
  .filter((session) => isHeld(session, now) && sessionIdOf(session) != null);
// An untitled session is named by its date ("Sep 23 · 10:35 PM"), not its database id.
const sessionLabel = (session) => [
  session.title || session.name || session.courseName
    || (session.startTime ? dayjs(session.startTime).format("MMM D") : `Session ${sessionIdOf(session) ?? ""}`),
  session.startTime ? dayjs(session.startTime).format("h:mm A") : "",
].filter(Boolean).join(" · ");

function AttendanceGrid({ gridData, currentMonth, collegeId, onCorrected, eligibilityThreshold = 75 }) {
  const now = dayjs();
  const [correctingKey, setCorrectingKey] = useState(null);
  const correctingRef = useRef(false);
  const [sessionChooser, setSessionChooser] = useState(null);
  const [recordFor, setRecordFor] = useState(null);
  const [record, setRecord] = useState(null);
  const [recordError, setRecordError] = useState(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [markStatus, setMarkStatus] = useState("");
  const recordSeq = useRef(0);

  useEffect(() => {
    ++recordSeq.current;
    setRecordFor(null); setSessionChooser(null); setRecord(null); setRecordError(null);
  }, [collegeId, currentMonth]);
  useEffect(() => () => { ++recordSeq.current; }, []);

  const fetchRecord = async (target) => {
    const request = ++recordSeq.current;
    setRecord(null); setRecordError(null); setRecordLoading(true);
    try {
      const response = await adminGetAttendanceRecord(collegeId, target.studentId, target.classScheduleId);
      if (request !== recordSeq.current) return;
      const data = response?.data?.data ?? response?.data;
      if (!data || typeof data !== "object" || typeof data.present !== "boolean") {
        throw new Error("The attendance record is incomplete. Retry before correcting it.");
      }
      setRecord(data);
    } catch (error) {
      if (request !== recordSeq.current) return;
      setRecord(null);
      setRecordError(error?.response?.data?.message || error?.message || "Could not load attendance record.");
    } finally { if (request === recordSeq.current) setRecordLoading(false); }
  };
  const openRecord = (target) => {
    setSessionChooser(null); setRecordFor(target); setMarkStatus("");
    fetchRecord(target);
  };
  const closeRecord = () => {
    if (correctingKey) return;
    ++recordSeq.current;
    setRecordFor(null); setRecord(null); setRecordError(null); setRecordLoading(false);
  };
  const correctCell = async (target, currentRecord, status = null) => {
    if (!currentRecord || recordError || recordLoading || correctingRef.current) return false;
    const key = `${target.studentId}:${target.classScheduleId}`;
    correctingRef.current = true;
    setCorrectingKey(key);
    try {
      if (currentRecord.present === false) {
        await adminMarkPresent(collegeId, target.studentId, target.classScheduleId);
      } else {
        await adminMarkAbsent(collegeId, { studentId: target.studentId, classScheduleId: target.classScheduleId, status });
      }
      message.success(`Attendance corrected for ${target.studentName} — ${target.label}.`);
      closeRecord();
      onCorrected?.();
      return true;
    } catch (error) {
      message.error(error?.response?.data?.message || "Attendance correction failed. Retry without closing this record.");
      return false;
    } finally { correctingRef.current = false; setCorrectingKey(null); }
  };

  const held = heldSessions(gridData?.classes, now);
  const unmarkedSessions = held.filter((session) => !session?.attendanceMarked);
  const studentCount = gridData?.absentees?.length ?? 0;
  // Per student: only sessions that were actually marked (or where they were absent) count.
  const tallies = (gridData?.absentees ?? []).map((student) => {
    const absentIds = Array.isArray(student?.absent) ? student.absent : [];
    const counted = held.filter((session) => isSessionCounted(absentIds, session)).length;
    const absences = held.filter((session) => isSessionAbsent(absentIds, session)).length;
    return { counted, absences };
  });
  const totalMarks = tallies.reduce((sum, t) => sum + t.counted, 0);
  const absentCount = tallies.reduce((sum, t) => sum + t.absences, 0);
  const presentCount = Math.max(0, totalMarks - absentCount);
  const attendancePercent = totalMarks ? Math.round(presentCount * 100 / totalMarks) : null;
  const month = dayjs(currentMonth);
  const firstDayOfMonth = month.startOf("month").day();
  const daysInMonth = month.daysInMonth();
  const dates = Array.from({ length: daysInMonth }, (_, index) => ({
    index: index + 1, weekday: DAYS_OF_WEEK[(firstDayOfMonth + index) % 7],
  }));
  const scheduledDays = Object.values(gridData?.classes ?? {}).filter((sessions) =>
    Array.isArray(sessions) && sessions.length > 0).length;

  if (!gridData?.classes || !Array.isArray(gridData?.absentees)
      || (gridData.absentees.length === 0 && Object.keys(gridData.classes).length === 0)) {
    return <Empty description="No attendance data for this class, course and month" />;
  }

  return <>
    <section className="learn-attendance-summary learn-attendance-summary--faculty" aria-label="Attendance summary">
      <div className="learn-attendance-summary__primary">
        <span>Monthly class health</span>
        <strong>{attendancePercent == null ? "—" : `${attendancePercent}%`}</strong>
        <p>{totalMarks ? `${presentCount} present marks across ${held.length - unmarkedSessions.length} marked sessions.`
          : held.length ? "Sessions were held, but no attendance has been marked yet." : "No sessions have been held this month."}</p>
      </div>
      <div className="learn-attendance-summary__stats">
        <span><strong>{studentCount}</strong> Students</span>
        <span><strong>{held.length}</strong> Sessions held</span>
        <span><strong>{absentCount}</strong> Absences</span>
        {unmarkedSessions.length > 0 && <span style={{ color: "#ad6800" }}><strong>{unmarkedSessions.length}</strong> Not marked</span>}
      </div>
    </section>
    <section className="learn-attendance-grid-card">
      <div className="learn-attendance-grid-card__header">
        <div><span>Monthly Attendance</span><h3>Review attendance day by day; open any held session to inspect and correct it.</h3></div>
        <div className="learn-attendance-grid-card__meta">
          <span><strong>{scheduledDays}</strong> Active days</span>
          <span><strong>{month.format("MMMM YYYY")}</strong></span>
        </div>
      </div>
      <div className="learn-attendance-grid-card__legend" aria-label="Attendance legend">
        <span className="legend-chip legend-chip--present">P = Present</span>
        <span className="legend-chip legend-chip--absent">A = Absent</span>
        <span className="legend-chip">N = Held, attendance not marked</span>
        <span className="legend-chip legend-chip--none">✖ = No class</span>
        <span className="legend-chip">2/3 = sessions attended; open to choose a session</span>
      </div>
      <div className="attend-body">
        <table className="attendance-grid">
          <caption className="sr-only">Attendance by student and day for {month.format("MMMM YYYY")}</caption>
          <thead>
            <tr className="week-days-header">
              <th scope="col" className="ln-stu-corner" aria-label="Student name" />
              {dates.map(({ index, weekday }) => <th scope="col" className={`item ${weekday === "Sun" ? "sunday" : ""}`}
                key={`weekday-${index}`} aria-label={weekday}>{weekday?.[0] ?? ""}</th>)}
              <th scope="col" className="ln-stu-corner" aria-label="Attendance percentage" />
            </tr>
            <tr className="days-header">
              <th scope="col" className="ln-stu-corner ln-stu-corner--head">Student Name</th>
              {dates.map(({ index, weekday }) => <th scope="col" className={`days ${weekday === "Sun" ? "sunday" : ""}`}
                key={`day-${index}`} aria-label={`${weekday} ${index}`}>{index}</th>)}
              <th scope="col" className="ln-stu-corner ln-stu-corner--head" aria-label="Attendance percentage this month, marked sessions only" title="This month, marked sessions only. Exam eligibility is judged on the whole semester.">% month</th>
            </tr>
          </thead>
          <tbody>{gridData.absentees.map((student, rowIndex) => {
            const absentIds = Array.isArray(student?.absent) ? student.absent : [];
            const { counted, absences: studentAbsences } = tallies[rowIndex];
            const studentPercent = counted ? Math.round((counted - studentAbsences) * 100 / counted) : null;
            return <tr key={student.studentId ?? rowIndex} className="attendee-header">
              <th scope="row" className="ln-stu-name">{student.studentName}</th>
              {dates.map(({ index, weekday }) => {
                const attendance = dayFor(gridData.classes, dayKey(index), absentIds, now);
                if (!attendance.scheduled) return <td key={`day-${index}`}
                  className={`attendance ${weekday === "Sun" ? "sunday" : ""}`} aria-label="No class scheduled">
                  <span aria-hidden="true">✖</span></td>;
                const notMarked = attendance.countedCount === 0;
                const label = notMarked ? "Attendance not marked"
                  : attendance.count > 1
                  ? `${attendance.countedCount - attendance.absentCount} of ${attendance.countedCount} marked sessions attended`
                  : attendance.allAbsent ? "Absent" : "Present";
                const target = { studentId: student.studentId, studentName: student.studentName,
                  classScheduleId: sessionIdOf(attendance.sessions[0]), label: sessionLabel(attendance.sessions[0]) };
                const correctable = collegeId != null && attendance.sessions.some((session) => sessionIdOf(session) != null);
                const text = notMarked ? "N"
                  : attendance.count > 1
                  ? `${attendance.countedCount - attendance.absentCount}/${attendance.countedCount}`
                  : attendance.allAbsent ? "A" : "P";
                return <td key={`day-${index}`}
                  className={`attendance ${weekday === "Sun" ? "sunday" : ""} ${notMarked ? "N" : attendance.allAbsent ? "A" : "P"}`}
                  aria-label={label} style={correctable ? { cursor: "pointer" } : undefined}>
                  {correctable ? <button type="button" aria-label={`${label} — ${student.studentName} — open session details`}
                    style={{ border: 0, padding: 0, background: "transparent", width: "100%", cursor: "pointer", color: "inherit" }}
                    onClick={() => {
                      if (attendance.count === 1) openRecord(target);
                      else setSessionChooser({ studentId: student.studentId, studentName: student.studentName,
                        sessions: attendance.sessions, absentIds });
                    }}>
                    {correctingKey === `${target.studentId}:${target.classScheduleId}` ? <Spin size="small" /> : text}
                  </button> : text}
                </td>;
              })}
              <td className={`attendance ln-stu-percent${studentPercent != null && studentPercent < eligibilityThreshold ? " attendance--at-risk" : ""}`}>
                {studentPercent == null ? "—" : <Tag color={studentPercent < eligibilityThreshold ? "red"
                  : studentPercent < eligibilityThreshold + 10 ? "orange" : "green"}>{studentPercent}%</Tag>}
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </section>

    <Modal open={Boolean(sessionChooser)} onCancel={() => setSessionChooser(null)}
      title={sessionChooser ? `Choose a session — ${sessionChooser.studentName}` : "Choose a session"}
      footer={null} destroyOnClose>
      <Typography.Paragraph type="secondary">Only the session you open will be corrected; other sessions remain unchanged.</Typography.Paragraph>
      <Space direction="vertical" style={{ width: "100%" }}>
        {(sessionChooser?.sessions || []).map((session) => {
          const id = sessionIdOf(session);
          const absent = isSessionAbsent(sessionChooser.absentIds, session);
          return <Button key={id ?? sessionLabel(session)} block style={{ height: "auto", minHeight: 44, textAlign: "left", whiteSpace: "normal" }}
            disabled={id == null}
            onClick={() => openRecord({ studentId: sessionChooser.studentId,
              studentName: sessionChooser.studentName, classScheduleId: id, label: sessionLabel(session) })}>
            {sessionLabel(session)} · {absent ? "Absent" : session?.attendanceMarked ? "Present" : "Not marked"}
          </Button>;
        })}
      </Space>
    </Modal>

    <Modal open={Boolean(recordFor)} onCancel={closeRecord} footer={null} destroyOnClose
      title={recordFor ? `Attendance — ${recordFor.studentName} — ${recordFor.label}` : "Attendance"}>
      {recordLoading ? <DetailSkeleton withMedia={false} label="Loading attendance record" />
        : recordError ? <Alert type="error" showIcon message="Attendance record unavailable"
          description="No attendance status can be inferred from this failure. Corrections are disabled until the record loads."
          action={<Button size="small" onClick={() => fetchRecord(recordFor)}>Retry record</Button>} />
        : !record ? <Alert type="warning" showIcon message="Attendance record not loaded" />
        : <>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Session">{recordFor?.label}</Descriptions.Item>
            <Descriptions.Item label="Current state">
              {record.present === false
                ? <Tag color={record.attendanceStatus === "ABSENT" ? "red" : "orange"}>{statusLabel(record.attendanceStatus, "Absent")}</Tag>
                // SA-ATT-014: no absence row can mean the student was actually present, or that
                // nobody has taken attendance for this session at all — those are not the same
                // thing, and showing PRESENT either way hid a class that was never marked.
                : record.attendanceMarked === false
                ? <Tag color="gold">Not marked yet</Tag>
                : <Tag color="green">Present</Tag>}
            </Descriptions.Item>
            {record.present === false && <>
              <Descriptions.Item label="Marked by">{record.markedByName || "Not recorded"}</Descriptions.Item>
              <Descriptions.Item label="Marked at">{/* Server UTC (the absence row's createdAt); plain dayjs read it as local time, 5½ hours early. */}
                {record.markedAt ? formatTimestamp(record.markedAt) : "—"}</Descriptions.Item>
            </>}
          </Descriptions>
          {record.present === false ? <Button type="primary" loading={Boolean(correctingKey)}
            disabled={Boolean(correctingKey)} onClick={() => correctCell(recordFor, record)}>Mark present</Button>
            : <div>
              <div style={{ marginBottom: 8 }}>Mark absent, optionally with a reason:</div>
              <Radio.Group value={markStatus} onChange={(event) => setMarkStatus(event.target.value)}
                style={{ marginBottom: 12 }}>
                <Radio value="">Absent</Radio><Radio value="EXCUSED">Excused</Radio>
                <Radio value="MEDICAL">Medical</Radio><Radio value="LATE">Late</Radio>
              </Radio.Group>
              <div><Button danger type="primary" loading={Boolean(correctingKey)} disabled={Boolean(correctingKey)}
                onClick={() => correctCell(recordFor, record, markStatus || null)}>Mark absent</Button></div>
            </div>}
        </>}
    </Modal>
  </>;
}

export default function Attendance({ collegeId = null }) {
  const isCollegeScoped = collegeId != null && Number.isInteger(Number(collegeId)) && Number(collegeId) > 0;
  const [eligibilityThreshold, setEligibilityThreshold] = useState(75);
  const [classOptions, setClassOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  // Courses this class is actually taught (teaching assignments). The picker used to list every
  // course in the college, so most class x course pairs were silently empty grids.
  const [classCourses, setClassCourses] = useState(null); // null = not loaded
  const [classCoursesLoading, setClassCoursesLoading] = useState(false);
  const [classCoursesError, setClassCoursesError] = useState(false);
  const [classCoursesRetryKey, setClassCoursesRetryKey] = useState(0);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => dayjs());
  const [gridData, setGridData] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  // fetchGrid reads the loaded scope through a ref: depending on the state would rebuild fetchGrid after every
  // successful load and re-run the fetch effect, sending a duplicate request each time.
  const loadedScopeKeyRef = useRef(null);
  loadedScopeKeyRef.current = loadedScopeKey;
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const [optionsRetryKey, setOptionsRetryKey] = useState(0);
  const gridRequestId = useRef(0);
  const [selectionCollegeId, setSelectionCollegeId] = useState(collegeId);
  const attendanceScopeKey = isCollegeScoped && selectionCollegeId === collegeId && selectedClassId && selectedCourseId
    ? JSON.stringify([Number(collegeId), Number(selectedClassId), Number(selectedCourseId), currentMonth.format("YYYY-MM")])
    : null;
  const hasCurrentGrid = attendanceScopeKey != null && loadedScopeKey === attendanceScopeKey && gridData != null;
  const currentLoadError = errorScopeKey === attendanceScopeKey ? loadError : null;
  const initialGridLoading = Boolean(attendanceScopeKey && loading && !hasCurrentGrid && !currentLoadError);
  const gridRefreshing = Boolean(attendanceScopeKey && loading && hasCurrentGrid);

  useEffect(() => {
    gridRequestId.current += 1;
    setGridData(null); setLoadedScopeKey(null); setErrorScopeKey(null); setLoading(false); setLoadError(null);
    setSelectedClassId(null); setSelectedCourseId(null); setSelectionCollegeId(collegeId);
    if (!isCollegeScoped) { setClassOptions([]); setCourseOptions([]); return; }
    let cancelled = false;
    setOptionsLoading(true); setOptionsError(false);
    Promise.all([getClassesByCollege(collegeId), getCoursesByCollege(collegeId)])
      .then(([classesRes, coursesRes]) => {
        if (cancelled) return;
        const classes = classesRes?.data?.data ?? classesRes?.data ?? [];
        const courses = coursesRes?.data?.data ?? coursesRes?.data ?? [];
        if (!Array.isArray(classes) || !Array.isArray(courses)) throw new Error("Unexpected filter response");
        setClassOptions(classes.map((row) => ({ value: row.id,
          // Elective offerings run as their own sections named "[Elective] Course · Slot".
          label: (() => {
            const name = row.name || row.class_name || row.className || `Section ${row.id}`;
            return /^\[Elective\]\s*/.test(name) ? `${name.replace(/^\[Elective\]\s*/, "")} (elective)` : name;
          })() })));
        setCourseOptions(courses.map((row) => ({ value: row.id,
          label: row.course_name || row.courseName || `Course ${row.id}` })));
      })
      .catch(() => {
        if (cancelled) return;
        setClassOptions([]); setCourseOptions([]); setOptionsError(true);
      })
      .finally(() => { if (!cancelled) setOptionsLoading(false); });
    return () => { cancelled = true; };
  }, [isCollegeScoped, collegeId, optionsRetryKey]);

  useEffect(() => {
    setClassCourses(null);
    setClassCoursesError(false);
    setShowAllCourses(false);
    // A course selection belongs to a class. Never carry the previous class's course through a
    // class switch while the new class-course relationship is unknown.
    setSelectedCourseId(null);
    setGridData(null);
    setLoadedScopeKey(null);
    setErrorScopeKey(null);
    setLoadError(null);
    if (!selectedClassId) {
      setClassCoursesLoading(false);
      return;
    }
    let cancelled = false;
    setClassCoursesLoading(true);
    getAssignmentsByClass(selectedClassId)
      .then((res) => {
        if (cancelled) return;
        const rows = res?.data?.data ?? res?.data ?? [];
        if (!Array.isArray(rows)) {
          setClassCourses(null);
          setClassCoursesError(true);
          return;
        }
        // The endpoint answers in snake_case (course_id, course_name, semester_number, is_active);
        // reading only camelCase skipped every row, so the list always fell back to all courses.
        const norm = (r) => ({
          courseId: r?.courseId ?? r?.course_id,
          courseName: r?.courseName ?? r?.course_name,
          semesterNumber: r?.semesterNumber ?? r?.semester_number,
          isActive: r?.isActive ?? r?.is_active ?? r?.active,
        });
        const byCourse = new Map();
        rows.map(norm).forEach((row) => {
          if (row?.courseId == null) return;
          const prev = byCourse.get(row.courseId);
          // Prefer the active / latest-semester assignment for the label.
          if (!prev || (row.isActive && !prev.isActive)
              || (Boolean(row.isActive) === Boolean(prev.isActive) && (row.semesterNumber ?? 0) > (prev.semesterNumber ?? 0))) {
            byCourse.set(row.courseId, row);
          }
        });
        const options = [...byCourse.values()]
          .sort((a, b) => Number(Boolean(b.isActive)) - Number(Boolean(a.isActive)) || (b.semesterNumber ?? 0) - (a.semesterNumber ?? 0))
          .map((row) => ({ value: row.courseId,
            label: `${row.courseName || `Course ${row.courseId}`}${row.semesterNumber ? ` · Sem ${row.semesterNumber}` : ""}${row.isActive ? "" : " · past"}` }));
        setClassCourses(options);
        setClassCoursesError(false);
      })
      .catch(() => {
        if (!cancelled) {
          setClassCourses(null);
          setClassCoursesError(true);
        }
      })
      .finally(() => { if (!cancelled) setClassCoursesLoading(false); });
    return () => { cancelled = true; };
  }, [selectedClassId, classCoursesRetryKey]);

  // Showing every college course is an explicit admin choice only after the class-specific source
  // has been verified. Loading/failure never broadens the action scope.
  const visibleCourseOptions = showAllCourses ? courseOptions : (classCourses || []);

  const fetchGrid = useCallback(() => {
    const requestId = ++gridRequestId.current;
    const requestScopeKey = attendanceScopeKey;
    if (!isCollegeScoped || selectionCollegeId !== collegeId || !selectedClassId || !selectedCourseId || !requestScopeKey) {
      setGridData(null); setLoadedScopeKey(null); setErrorScopeKey(null); setLoading(false); setLoadError(null); return;
    }
    const scopeChanged = loadedScopeKeyRef.current !== requestScopeKey;
    if (scopeChanged) setGridData(null);
    setLoading(true); setLoadError(null); setErrorScopeKey(null);
    getAdminAttendanceMonthlyGrid({
      collegeId, classId: selectedClassId, courseId: selectedCourseId,
      startDate: currentMonth.startOf("month").format("YYYY-MM-DD"),
      endDate: currentMonth.endOf("month").format("YYYY-MM-DD"),
    })
      .then((data) => {
        if (requestId !== gridRequestId.current) return;
        setGridData(data ?? { classes: {}, absentees: [] });
        setLoadedScopeKey(requestScopeKey);
      })
      .catch(() => {
        if (requestId !== gridRequestId.current) return;
        setLoadError("Couldn't load attendance data.");
        setErrorScopeKey(requestScopeKey);
        if (scopeChanged) setGridData(null);
      })
      .finally(() => { if (requestId === gridRequestId.current) setLoading(false); });
  }, [isCollegeScoped, selectionCollegeId, collegeId, selectedClassId, selectedCourseId, currentMonth, attendanceScopeKey]);
  useEffect(() => {
    fetchGrid();
    return () => { gridRequestId.current += 1; };
  }, [fetchGrid]);
  const monthLabel = useMemo(() => currentMonth.format("MMMM YYYY"), [currentMonth]);

  const handleExportGrid = () => {
    if (!gridData?.absentees) return;
    const now = dayjs();
    const dates = Array.from({ length: currentMonth.daysInMonth() }, (_, index) => index + 1);
    const columns = [{ label: "Student", key: "studentName" },
      ...dates.map((date) => ({ label: String(date), key: `d${date}` }))];
    const rows = gridData.absentees.map((student) => {
      const row = { studentName: student.studentName };
      dates.forEach((date) => {
        // Match the on-screen grid exactly: a multi-session day shows as a ratio there
        // ("1/2" attended), not a single P/A — collapsing it to a single flag would silently
        // lose that information, so a student who attended 1 of 2 sessions would export as "P"
        // while the screen showed "1/2".
        const { scheduled, count, absentCount, countedCount } = dayFor(gridData.classes, dayKey(date), student?.absent, now);
        row[`d${date}`] = !scheduled ? "" : countedCount === 0 ? "N"
          : count > 1 ? `${countedCount - absentCount}/${countedCount}` : absentCount ? "A" : "P";
      });
      return row;
    });
    exportRowsToCsv(`attendance-class-${selectedClassId}-course-${selectedCourseId}-${currentMonth.format("YYYY-MM")}.csv`, columns, rows);
  };

  return <>
    <div className="admin-list-page__header">
      <div>
        <h1 className="admin-list-page__title">Attendance</h1>
        <div className="admin-list-page__subtitle">Review monthly attendance by class and course, correct recent records, and export the same grid shown on screen.</div>
      </div>
    </div>
    {!isCollegeScoped ? <Alert type="warning" showIcon message="Select a College to view attendance" /> : <>
      <Card size="small" title="Attendance policy" style={{ marginBottom: 16 }}>
        <PolicySettingField collegeId={collegeId} settingKey="attendance.correctionWindowHours"
          label="Late marking allowed for"
          help="How long after a class ends attendance can be marked or corrected."
          defaultValue={24} min={1} max={168} suffix="hours" />
        <PolicySettingField collegeId={collegeId} onValueChange={setEligibilityThreshold}
          settingKey="attendance.eligibilityThresholdPercent" label="Minimum attendance"
          help="Shown to students, and used here to flag students below it. It does not block anyone from exams."
          defaultValue={75} min={1} max={100} suffix="%" />
      </Card>
      {optionsError && <Alert type="error" showIcon message="Couldn't load classes/courses for this college"
        description="Retry to distinguish a temporary lookup failure from no classes or courses."
        action={<Button size="small" onClick={() => setOptionsRetryKey((value) => value + 1)}>Retry</Button>}
        style={{ marginBottom: 16 }} />}
      {classCoursesError && selectedClassId && (
        <Alert type="warning" showIcon message="Couldn't verify which courses are taught to this class"
          description="Course selection is disabled so an unrelated college course cannot be used accidentally."
          action={<Button size="small" onClick={() => setClassCoursesRetryKey((value) => value + 1)}>Retry class courses</Button>}
          style={{ marginBottom: 16 }} />
      )}
      <div className="admin-attendance-filters" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <Select aria-label="Select attendance class" placeholder={optionsError ? "Classes unavailable" : "Select class"} style={{ width: 220, maxWidth: "100%" }}
          options={classOptions} loading={optionsLoading} disabled={optionsError || optionsLoading} value={selectedClassId} onChange={setSelectedClassId}
          showSearch filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())} />
        <Select aria-label="Select attendance course"
          placeholder={classCoursesLoading ? "Loading class courses…" : classCoursesError ? "Class courses unavailable" : !showAllCourses && classCourses && classCourses.length === 0 ? "No courses linked to this class" : "Select course"}
          style={{ width: 220, maxWidth: "100%" }}
          options={visibleCourseOptions} loading={optionsLoading || classCoursesLoading}
          disabled={optionsError || optionsLoading || !selectedClassId || classCoursesLoading || classCoursesError}
          value={selectedCourseId} onChange={(value) => {
            setSelectedCourseId(value);
            setGridData(null);
            setLoadedScopeKey(null);
            setErrorScopeKey(null);
            setLoadError(null);
          }}
          showSearch filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())} />
        {classCourses && !classCoursesError && !classCoursesLoading && <Button type="link" size="small" style={{ padding: 0 }}
          onClick={() => { setShowAllCourses((value) => !value); setSelectedCourseId(null); }}>
          {showAllCourses ? "Only courses taught to this class" : "Show all college courses"}
        </Button>}
        <Button icon={<LeftOutlined />} onClick={() => setCurrentMonth((date) => date.subtract(1, "month"))} aria-label="Previous month" />
        <span style={{ minWidth: 120, textAlign: "center", fontWeight: 600 }}>{monthLabel}</span>
        <Button icon={<RightOutlined />} onClick={() => setCurrentMonth((date) => date.add(1, "month"))} aria-label="Next month" />
        <Button icon={<DownloadOutlined />} onClick={handleExportGrid} disabled={!gridData?.absentees?.length}>Export CSV</Button>
      </div>
      {gridRefreshing ? <RefreshStatus label="Refreshing attendance…" /> : null}
      {currentLoadError ? (
        <Alert
          type={hasCurrentGrid ? "warning" : "error"}
          showIcon
          message={hasCurrentGrid ? "Couldn't refresh attendance" : currentLoadError}
          description={hasCurrentGrid ? "Showing the last attendance loaded for this class, course and month." : undefined}
          action={<Button size="small" onClick={fetchGrid}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {!selectedClassId || !selectedCourseId ? <Empty description="Pick a class and course to view attendance" />
        : initialGridLoading ? <TableSkeleton rows={8} columns={8} label="Loading monthly attendance" />
        : currentLoadError && !hasCurrentGrid ? null
        : hasCurrentGrid ? <AttendanceGrid gridData={gridData} currentMonth={currentMonth} collegeId={collegeId}
            onCorrected={fetchGrid} eligibilityThreshold={eligibilityThreshold} />
        : null}
    </>}
  </>;
}
