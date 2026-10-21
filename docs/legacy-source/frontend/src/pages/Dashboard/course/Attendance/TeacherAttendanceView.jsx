import React, { memo, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import TakeAttendance from "./TakeAttendance";
import { useDispatch, useSelector } from "react-redux";
import { getStudentAttendanceByDaterange } from "@/api/Services/attendanceServices";
import { DAYS_OF_WEEK, isHeldClassSession as isHeld } from "@/utils/attendanceConstants";
import { Button, Empty, Spin, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import CustomToolTipTable from "@/components/Global/Tooltips/CustomToolTipTable";
import { courseAction } from "@/redux/store";
import { buildMonthlyAttendanceReport } from "@/utils/monthlyAttendanceReport";
import { downloadMonthlyAttendancePdf } from "@/utils/downloadMonthlyAttendancePdf";

/** Backend uses zero-padded day keys "01"-"31"; normalize for lookup. */
function dayKey(dayIdx) {
  return String(dayIdx).padStart(2, "0");
}

function getMonthlyClassIds(classesByDay, now) {
  return Object.values(classesByDay ?? {})
    .flat()
    .filter(item => isHeld(item, now))
    .map(item => item?.Id ?? item?.classScheduleId)
    .filter(id => id != null);
}

function TeacherAttendanceView({ isTakeAttendance }) {
  const dispatch = useDispatch();
  const loginUser = useSelector(state => state.loginUser);
  const course = useSelector(state => state.course);
  const { attendeeOrgData, attendeeCurMonth } = useSelector(
    state => state.course
  );
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [atndViewHeader, setAtndViewHeader] = useState({});
  const [loading, setLoading] = useState(false);
  // A fetch failure and a genuinely empty month must have different states.
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestSeqRef.current;
    const classId = loginUser?.classId;
    setStudentAttendance(null);
    setAtndViewHeader({});
    if (classId == null || classId === "") {
      dispatch(courseAction.handleCourseData({ key: "attendeeOrgData", value: null }));
      setLoading(false);
      setLoadError(false);
      return;
    }
    const slug = course?.selectedCourseSlug;
    const id = course?.selectedCourseId;
    const params = {
      classId: Number(classId),
      startDate: dayjs(attendeeCurMonth).startOf("month").format("YYYY-MM-DD"),
      endDate: dayjs(attendeeCurMonth).endOf("month").format("YYYY-MM-DD"),
      facultyId: Number(loginUser?.id),
    };
    if (slug) params.courseSlug = slug;
    else if (id) params.courseId = Number(id);
    if (params.courseSlug || params.courseId) {
      setLoading(true);
      setLoadError(false);
      getStudentAttendanceByDaterange(params)
        .then(resData => {
          if (requestId !== requestSeqRef.current) return;
          dispatch(
            courseAction.handleCourseData({
              key: "attendeeOrgData",
              value: resData ?? null,
            })
          );
        })
        .catch(() => {
          if (requestId !== requestSeqRef.current) return;
          setLoadError(true);
          dispatch(
            courseAction.handleCourseData({
              key: "attendeeOrgData",
              value: null,
            })
          );
        })
        .finally(() => {
          if (requestId === requestSeqRef.current) setLoading(false);
        });
    } else {
      setLoading(false);
      setLoadError(false);
      dispatch(
        courseAction.handleCourseData({
          key: "attendeeOrgData",
          value: null,
        })
      );
    }
  }, [attendeeCurMonth, course?.selectedCourseSlug, course?.selectedCourseId, loginUser?.classId, loginUser?.id, retryCount]);

  useEffect(() => {
    if (attendeeOrgData?.classes && attendeeOrgData?.absentees) {
      const [stdAttendance, weekDays, days] = createAggregateAttendanceView();
      setAtndViewHeader({ weekDays, days });
      setStudentAttendance({ stdAttendance });
    } else {
      setAtndViewHeader({});
      setStudentAttendance(null);
    }
  }, [attendeeOrgData]);

  if (isTakeAttendance) {
    return <TakeAttendance />;
  }
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spin size="large" />
      </div>
    );
  }
  if (loadError) {
    return (
      <Empty description="Couldn't load attendance data for this month.">
        <Button onClick={() => setRetryCount((count) => count + 1)}>Retry</Button>
      </Empty>
    );
  }
  if (!attendeeOrgData?.classes || !attendeeOrgData?.absentees) {
    return <Empty description="No attendance data for this month" />;
  }
  // Student names are rendered in the grid's row headers, not a separate stuNames state.
  // The old stuNames guard was always true and left this page spinning forever even
  // after a successful attendance response and aggregate computation.
  if (!studentAttendance?.stdAttendance) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spin size="large" />
      </div>
    );
  }
  const now = dayjs();
  const monthlyClassIds = getMonthlyClassIds(attendeeOrgData?.classes, now);
  const monthlyClassIdSet = new Set(monthlyClassIds);
  // A held session with no attendance submission yet has zero rows in `attend` either way, so it
  // was previously indistinguishable from "attendance was taken and everyone was present" — every
  // freshly-held class read as 100% present. `attendanceMarked` (set only once a faculty actually
  // submits a bulk mark for that session, see AttendanceBulkController) is the real signal.
  const unmarkedClassIds = new Set(
    Object.values(attendeeOrgData?.classes ?? {})
      .flat()
      .filter(item => isHeld(item, now) && !item?.attendanceMarked)
      .map(item => item?.Id ?? item?.classScheduleId)
      .filter(id => id != null)
  );
  const studentCount = attendeeOrgData?.absentees?.length ?? 0;
  // Was `sessions.length > 0` -- counted a day with only a not-yet-held (later this month)
  // session as "active" too, while the grid right below this stat treats that exact same day as
  // "No class" (the isHeld filter in createAggregateAttendanceView excludes it entirely, by
  // design -- see its own comment). "12 Active days" sitting above a grid where only, say, 8 of
  // those days actually show any P/A/N marks read as the two disagreeing with each other.
  const scheduledDays = Object.values(attendeeOrgData?.classes ?? {}).filter(
    sessions => Array.isArray(sessions) && sessions.some(session => isHeld(session, now))
  ).length;
  const totalMarks = studentCount * monthlyClassIds.length;
  const absentCount = (attendeeOrgData?.absentees ?? []).reduce((total, student) => {
    const absences = Array.isArray(student?.absent) ? student.absent : [];
    return total + absences.filter(id => monthlyClassIdSet.has(id)).length;
  }, 0);
  const notMarkedCount = studentCount * unmarkedClassIds.size;
  const presentCount = Math.max(totalMarks - absentCount - notMarkedCount, 0);
  const markedTotal = Math.max(totalMarks - notMarkedCount, 0);
  const attendancePercent = markedTotal > 0 ? Math.round((presentCount / markedTotal) * 100) : 0;

  const handleDownloadReport = () => {
    try {
      const report = buildMonthlyAttendanceReport(attendeeOrgData, attendeeCurMonth);
      downloadMonthlyAttendancePdf({
        report,
        courseName: loginUser?.selectedCourse?.name,
        className: loginUser?.className,
      });
    } catch {
      message.error("Couldn't generate the attendance report. Please try again.");
    }
  };

  return (
    <>
      <section className="learn-attendance-summary learn-attendance-summary--faculty" aria-label="Faculty attendance summary">
        <div className="learn-attendance-summary__primary">
          <span>Monthly class health</span>
          <strong>{markedTotal > 0 ? `${attendancePercent}%` : "—"}</strong>
          <p>
            {totalMarks > 0
              ? `${presentCount} present marks across ${monthlyClassIds.length} scheduled sessions.`
              : "No scheduled sessions found for this month."}
            {unmarkedClassIds.size > 0
              ? ` ${unmarkedClassIds.size} session${unmarkedClassIds.size === 1 ? "" : "s"} not yet marked, excluded from this percentage.`
              : ""}
          </p>
        </div>
        <div className="learn-attendance-summary__stats">
          <span><strong>{studentCount}</strong> Students</span>
          <span><strong>{monthlyClassIds.length}</strong> Sessions</span>
          <span><strong>{absentCount}</strong> Absences</span>
          {unmarkedClassIds.size > 0 && (
            <span><strong>{unmarkedClassIds.size}</strong> Not marked</span>
          )}
        </div>
      </section>
      <section className="learn-attendance-grid-card">
        <div className="learn-attendance-grid-card__header">
          <div>
            <span>Monthly Attendance</span>
            <h3>See each student’s attendance day by day for this month.</h3>
          </div>
          <div className="learn-attendance-grid-card__meta">
            <span><strong>{scheduledDays}</strong> Active days</span>
            <span><strong>{dayjs(attendeeCurMonth).format("MMMM YYYY")}</strong></span>
            <Button
              size="small"
              icon={<DownloadOutlined aria-hidden />}
              onClick={handleDownloadReport}
              disabled={studentCount === 0}
            >
              Download Report
            </Button>
          </div>
        </div>
        <div className="learn-attendance-grid-card__legend" aria-label="Attendance legend">
          <span className="legend-chip legend-chip--present">P = Present</span>
          <span className="legend-chip legend-chip--absent">A = Absent</span>
          <span className="legend-chip legend-chip--not-marked">— = Not marked yet</span>
          <span className="legend-chip legend-chip--none">✖ = No class</span>
        </div>
        <div className="attend-body">
          <table className="attendance-grid">
            <caption className="sr-only">
              Attendance by student and day for {dayjs(attendeeCurMonth).format("MMMM YYYY")}
            </caption>
            <thead>
              <tr className="week-days-header">{atndViewHeader?.weekDays}</tr>
              <tr className="days-header">{atndViewHeader?.days}</tr>
            </thead>
            <tbody>{studentAttendance.stdAttendance}</tbody>
          </table>
        </div>
      </section>
    </>
  );
  function createAggregateAttendanceView() {
    // This callback runs from an effect after the INITIAL render. On that render the early
    // loading/empty return above skips the component-level `const now` declaration, leaving
    // it in the temporal dead zone. Read the clock inside this callback instead.
    const now = dayjs();
    const month = new Date(attendeeCurMonth).getMonth();
    const year = new Date(attendeeCurMonth).getFullYear();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Corner cell for the sticky name column. The student names used to live in a sibling <ul>,
    // aligned to the grid only by every .ln-stu-cell and every .attendance being exactly 50px
    // tall. Any font fallback, zoom level or rounding difference and row n of the names sat
    // beside row n+/-1 of the grid — i.e. every student displayed another student's attendance,
    // with no visual tell, on the record that gates exam eligibility.
    let x = [
      <th
        scope="col"
        className="ln-stu-corner"
        key="corner-weekdays"
        aria-label="Student name"
      />,
    ];
    let indxCount = firstDayOfMonth;
    const dates = [];
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push({ day: DAYS_OF_WEEK[indxCount], idx: i });
      x.push(
        <th
          scope="col"
          className={`item ${
            DAYS_OF_WEEK[indxCount] === "Sun" ? "sunday" : ""
          }`}
          key={`day-` + i}
          aria-label={DAYS_OF_WEEK[indxCount]}
        >
          {DAYS_OF_WEEK[indxCount++][0]}
        </th>
      );

      if (indxCount % 7 == 0) {
        indxCount = 0;
      }
    }
    let day = 1;
    let days = [
      <th scope="col" className="ln-stu-corner ln-stu-corner--head" key="corner-days">
        Student Name
      </th>,
    ];
    for (let i = 0; i < dates.length; i++) {
      const dayNum = day++;
      days.push(
        <th
          scope="col"
          className={`days ${dates?.[i]?.day === "Sun" ? "sunday" : ""}`}
          key={`${i}`}
          aria-label={`${dates?.[i]?.day ?? ""} ${dayNum}`}
        >
          {dayNum}
        </th>
      );
      // }
    }

    let stdAttendance = attendeeOrgData?.absentees?.map((data, i) => {
      const classesByDay = attendeeOrgData?.classes ?? {};
      return (
        <tr key={data.studentId ?? i} className="attendee-header">
          {/* A real row header: it scopes the whole row for assistive tech AND pins the name
              column with position: sticky, which the sibling-<ul> approach could never do
              without the pixel-height handshake described above. */}
          <th scope="row" className="ln-stu-name">
            {data.studentName}
          </th>
          {dates.map((date, index) => {
            const dk = dayKey(date?.idx);
            // Sessions later today or later this month haven't happened yet — they can never
            // appear in a student's `absent` list, so including them here would render a future
            // class as a green "P" (Present) before it's even occurred. Treat a day with only
            // not-yet-held sessions the same as a day with no class.
            const dayClasses = (classesByDay[dk] ?? []).filter(cls => isHeld(cls, now));
            const classSheduled = dayClasses && dayClasses.length > 0;
            const multipleClass = classSheduled && dayClasses.length > 1;
            return (
              <React.Fragment key={`date-${i}-${index}`}>
                {classSheduled ? (() => {
                    // Was computed from dayClasses[0] alone, so on a multi-session day the cell
                    // was tinted by session one's status while showing no letter at all — the
                    // exact colour-only failure the P/A glyphs exist to prevent, in the one case
                    // where the distinction matters most. Aggregate across every session instead.
                    const sessionCount = dayClasses?.length ?? 0;
                    // Per-session status: absent (an explicit mark exists), present (marked, not
                    // absent), or not-marked (no faculty submission for this session at all yet —
                    // see attendanceMarked/unmarkedClassIds above). Absence implies a mark was made,
                    // so it takes priority even though attendanceMarked is also true in that case.
                    const sessionStatuses = (dayClasses ?? []).map(cls =>
                      data?.absent?.includes(cls?.Id)
                        ? "A"
                        : cls?.attendanceMarked ? "P" : "N"
                    );
                    const absentCount = sessionStatuses.filter(s => s === "A").length;
                    const notMarkedSessionCount = sessionStatuses.filter(s => s === "N").length;
                    const attendedCount = sessionStatuses.filter(s => s === "P").length;
                    const allNotMarked = sessionCount > 0 && notMarkedSessionCount === sessionCount;
                    const isAbsent = sessionCount > 0
                      ? absentCount === sessionCount
                      : data?.absent?.includes(dayClasses?.[0]?.Id);
                    const partial = multipleClass
                      && new Set(sessionStatuses).size > 1;
                    const cellStatus = allNotMarked ? "N" : partial ? "partial" : isAbsent ? "A" : "P";
                    const cellLabel = multipleClass
                      ? `${attendedCount} present, ${absentCount} absent, ${notMarkedSessionCount} not marked of ${sessionCount} sessions`
                      : allNotMarked ? "Not marked yet" : isAbsent ? "Absent" : "Present";
                    return (
                      <td
                        className={`attendance  ${
                          date.day === "Sun" ? "sunday" : ""
                        } ${cellStatus}`}
                        aria-label={cellLabel}
                      >
                        {multipleClass ? (
                          <CustomToolTipTable
                            tableColoumns={columns()}
                            tableData={dayClasses?.map((classSheduled, ind) => ({
                              startTime: dayjs(
                                classSheduled?.startTime
                              ).format("h:mm A"),
                              attendance: data?.absent?.includes(classSheduled?.Id)
                                ? "A"
                                : classSheduled?.attendanceMarked ? "P" : "N",
                              id: ind,
                            }))}
                            toolTipBaseContent={
                              // `count={"1 +"}` was a literal string — a five-session day still
                              // read "1 +" — rendered as a white chip on a near-white cell, and
                              // reachable only by hover from a non-focusable div. Show the real
                              // ratio as text: more information, no hover required.
                              <span
                                className="attendance__ratio"
                                tabIndex={0}
                                role="button"
                                aria-label={cellLabel}
                              >
                                {attendedCount}/{sessionCount}
                              </span>
                            }
                          />
                        ) : allNotMarked ? (
                          <span aria-hidden="true">—</span>
                        ) : isAbsent ? (
                          <span aria-hidden="true">A</span>
                        ) : (
                          <span aria-hidden="true">P</span>
                        )}
                      </td>
                    );
                  })() : (
                  <td
                    className={`attendance ${
                      date.day === "Sun" ? "sunday" : ""
                    }`}
                    aria-label="No class scheduled"
                  >
                    <span aria-hidden="true">✖</span>
                  </td>
                )}
              </React.Fragment>
            );
          })}
        </tr>
      );
    });
    return [stdAttendance, x, days];
  }

  function columns() {
    return [
      {
        title: "Session Time",
        dataIndex: "startTime",
      },

      {
        title: "Attendance",
        dataIndex: "attendance",
        render: (text, ele) => {
          return (
            <div
              className={`attendance attendance-totp text-center bg-white ${text}`}
            >
              {text === "N" ? "—" : text}
            </div>
          );
        },
      },
    ];
  }
}

export default memo(TeacherAttendanceView);
