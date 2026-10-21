import { getStudentAttendanceListByDaterange } from "@/api/Services/attendanceServices";
import { Table, Spin, Empty, Alert, Button } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
let localizedFormat = require("dayjs/plugin/localizedFormat");
dayjs.extend(localizedFormat);
import StatusCol from "@/components/Attendance/StudentAttendance/StatusCol";
import { ATTENDANCE_THRESHOLD, attendanceHeadroom, learnerAttendanceTally, learnerSessionStatus } from "@/utils/attendanceConstants";

function StudentAttendanceView() {
  const attendeeCurMonth = useSelector(state => state.course?.attendeeCurMonth);
  const loginUser = useSelector(state => state.loginUser);
  const course = useSelector(state => state.course);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const slug = course?.selectedCourseSlug;
    const id = course?.selectedCourseId;
    const params = {
      startDate: dayjs(attendeeCurMonth).startOf("month").format("YYYY-MM-DD"),
      endDate: dayjs(attendeeCurMonth).endOf("month").format("YYYY-MM-DD"),
      learnerId: Number(loginUser?.id),
    };
    if (slug) params.courseSlug = slug;
    else if (id) params.courseId = Number(id);
    if (!params.courseSlug && !params.courseId) {
      setAttendanceData(null);
      setError(null);
      return () => { cancelled = true; };
    }
    setLoading(true);
    setError(null);
    getStudentAttendanceListByDaterange(params)
      .then(resData => {
        if (cancelled) return;
        setAttendanceData(resData?.classes ? resData : null);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load attendance.");
        setAttendanceData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [attendeeCurMonth, course?.selectedCourseSlug, course?.selectedCourseId, retryCount]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spin size="large" />
      </div>
    );
  }
  if (error) {
    return (
      <Alert
        type="error"
        message={error}
        showIcon
        className="mt-3"
        action={<Button size="small" onClick={() => setRetryCount((count) => count + 1)}>Retry</Button>}
      />
    );
  }
  const dataSource =
    attendanceData?.classes?.length > 0 ? attendanceData.classes : [];
  const absentIds = attendanceData?.absentids ?? [];
  // Only classes that have actually started can count toward a percentage. Previously this divided
  // by every class in the calendar month — including ones that haven't happened — and treated all
  // of them as attended, so on the 3rd of the month a learner with one absence was scored against
  // ~20 classes that don't exist yet.
  const now = dayjs();
  // Only marked sessions count: a held class nobody took attendance for is not a Present (LRN-AT-01).
  const tally = learnerAttendanceTally(dataSource, absentIds, now);
  const absentCount = tally.absent;
  const presentCount = tally.present;
  const heldCount = tally.counted;
  const attendancePercent = heldCount > 0 ? Math.round((presentCount / heldCount) * 100) : 0;
  // Was a bare hardcoded 75 with no backend knowledge of it at all -- now rides along on this same
  // response (see ClassScheduleController.getLearnerClassScheduleWithCourse), configurable per
  // college. Falls back to the same default if the field is missing (older cache, request failed
  // to enrich, etc.) so this never breaks on a stale/partial response.
  const ATTENDANCE_THRESHOLD_EFFECTIVE = Number.isFinite(attendanceData?.attendanceThresholdPercent)
    ? attendanceData.attendanceThresholdPercent
    : ATTENDANCE_THRESHOLD;
  const attendanceTone = heldCount === 0 ? "neutral" : attendancePercent >= ATTENDANCE_THRESHOLD_EFFECTIVE ? "safe" : "risk";
  // "How many more can I miss?" is the learner's actual question, and the old copy never answered it.
  const headroom = attendanceHeadroom(presentCount, heldCount, ATTENDANCE_THRESHOLD_EFFECTIVE);
  const canStillMiss = headroom.canMiss;
  return (
    <>
      <section className={`learn-attendance-summary learn-attendance-summary--${attendanceTone}`} aria-label="Student attendance summary">
        <div className="learn-attendance-summary__primary">
          <span>Attendance this month</span>
          <strong>{heldCount > 0 ? `${attendancePercent}%` : "—"}</strong>
          <p>
            {heldCount === 0
              ? "No classes held yet in this period."
              : attendanceTone === "safe"
              ? `You need ${ATTENDANCE_THRESHOLD_EFFECTIVE}%. You can miss ${canStillMiss} more ${canStillMiss === 1 ? "class" : "classes"} this month.`
              : headroom.recoverable
                ? `Below the ${ATTENDANCE_THRESHOLD_EFFECTIVE}% requirement. Attend the next ${headroom.mustAttend} ${headroom.mustAttend === 1 ? "class" : "classes"} to recover.`
                : `Below the ${ATTENDANCE_THRESHOLD_EFFECTIVE}% requirement. Talk to your faculty about it.`}
          </p>
        </div>
        <div className="learn-attendance-summary__stats">
          <span><strong>{presentCount}</strong> Present</span>
          <span><strong>{absentCount}</strong> Absent</span>
          <span><strong>{heldCount}</strong> Held</span>
        </div>
      </section>
      <section className="learn-attendance-detail-card">
        <div className="learn-attendance-detail-card__header">
          <div>
            <span>Attendance History</span>
            <h3>Review each scheduled class and your status for it.</h3>
          </div>
          <div className="learn-attendance-detail-card__meta">
            <span>{dayjs(attendeeCurMonth).format("MMMM YYYY")}</span>
          </div>
        </div>
      <div className="learn-attendance-student-desktop">
        <Table
          scroll={{ x: "max-content" }}
          className="attendance-table ln-table"
          columns={stuAttendViewColumn(absentIds, now)}
          dataSource={dataSource}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                description="No classes in this period"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </div>
      <div className="learn-attendance-student-mobile">
        {dataSource.length === 0 ? (
          <Empty
            description="No classes in this period"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="learn-attendance-student-empty"
          />
        ) : (
          <div className="learn-attendance-student-cards">
            {dataSource.map((row, i) => {
              // A class scheduled later today/this month can never be in `absentIds` yet — it
              // hasn't happened — so treating "not absent" as "Present" showed every upcoming
              // class as already attended. Same bug the percentage math above was fixed for,
              // just missed here in the actual list.
              const status = learnerSessionStatus(row, absentIds, now);
              return (
                <div key={row?.classScheduleId ?? i} className="learn-attendance-student-card">
                  <div className="learn-attendance-student-card__date">
                    {dayjs(row?.startTime).format("D MMM YYYY")}
                  </div>
                  <div className="learn-attendance-student-card__day">
                    {dayjs(row?.startTime).format("dddd")}
                  </div>
                  <div className="learn-attendance-student-card__time">
                    {dayjs(row?.startTime).format("h:mm A")}
                  </div>
                  <div className="learn-attendance-student-card__status">
                    <StatusCol statusClass={status.statusClass} status={status.label} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </section>
    </>
  );

  function stuAttendViewColumn(absent, referenceNow) {
    return [
      {
        title: "Date",
        dataIndex: "date",
        render: (text, ele) => {
          return <span>{dayjs(ele?.startTime).format("D MMM YYYY")}</span>;
        },
      },
      {
        title: "Day",
        dataIndex: "weekDay",
        render: (text, ele) => {
          return <span>{dayjs(ele?.startTime).format("dddd")}</span>;
        },
      },
      {
        title: "Class Start Time",
        dataIndex: "startTime",

        render: (text, ele) => {
          return <span>{dayjs(ele?.startTime).format("h:mm A")}</span>;
        },
      },
      {
        title: "Present/Absent",
        dataIndex: "status",
        render: (text, ele) => {
          const status = learnerSessionStatus(ele, absent, referenceNow);
          return <StatusCol statusClass={status.statusClass} status={status.label} />;
        },
      },
    ];
  }
}

export default StudentAttendanceView;
