import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { Alert, Button, DatePicker, Empty, Select, Skeleton, Table, Typography } from "antd";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
  LeftOutlined,
  RightOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import PageShell from "@/components/Common/PageShell";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import MetricPill from "@/components/Global/MetricPill/MetricPill";
import dayjs from "dayjs";
import { learnerAttendanceTally, learnerSessionStatus } from "@/utils/attendanceConstants";
import moment from "moment";
import { useSelector, useDispatch } from "react-redux";
import { notification } from "antd";
import { getLearnerAttendanceCourses, getLearnerAttendanceRecords } from "@/api/Services/attendanceServices";
import { attendanceAction } from "@/redux/store";
import StatusCol from "@/components/Attendance/StudentAttendance/StatusCol";
import { getFacultyCoursesPath } from "@/utils/facultyRouteUtils";

import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);

const { Text } = Typography;

function AttendanceEmptyIllustration() {
  return (
    <svg viewBox="0 0 120 80" className="learn-attendance-empty-illus" aria-hidden>
      <defs>
        <linearGradient id="attEmptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#26bac7" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#059669" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect x="20" y="15" width="80" height="50" rx="8" fill="url(#attEmptyGrad)" stroke="#26bac7" strokeWidth="1.5" strokeOpacity="0.35" />
      <circle cx="50" cy="35" r="10" fill="rgba(5,150,105,0.2)" stroke="#059669" strokeWidth="2" strokeOpacity="0.5" />
      <path d="M47 35 L49 37 L54 32" fill="none" stroke="#059669" strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="35" y="52" width="20" height="12" rx="4" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.4" />
      <rect x="65" y="52" width="20" height="12" rx="4" fill="rgba(5,150,105,0.2)" stroke="#059669" strokeWidth="1" strokeOpacity="0.4" />
    </svg>
  );
}

function AttendanceListItem({ record, status }) {
  return (
    <article className="learn-attendance-row-card">
      <div className="learn-attendance-row-card__main">
        <div className="learn-attendance-row-card__icon-wrap">
          <CalendarOutlined className="learn-attendance-row-card__icon" />
        </div>
        <div className="learn-attendance-row-card__content">
          <div className="learn-attendance-row-card__header">
            <h3 className="learn-attendance-row-card__title ln-lto-bold">
              {dayjs(record?.startTime).format("dddd, MMM D")}
            </h3>
            <StatusCol statusClass={status.statusClass} status={status.label} />
          </div>
          <p className="learn-attendance-row-card__meta ln-lto-reg">
            {dayjs(record?.startTime).format("h:mm A")}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function AttendanceContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const { studentData } = useSelector((state) => state.attendance);

  const [attendanceData, setAttendanceData] = useState(null);
  // Was previously indistinguishable from a genuinely empty month — a failed request and "no
  // classes this month" both landed on the same setAttendanceData(null) with no error signal,
  // so a fetch failure silently rendered "No attendance records" instead of a real error.
  const [attendanceLoadError, setAttendanceLoadError] = useState(false);
  const [attendanceRetryCount, setAttendanceRetryCount] = useState(0);

  useEffect(() => {
    if (loginUser?.userType === "FACULTY") {
      router.replace(getFacultyCoursesPath(router.pathname, loginUser?.facultyType));
    }
  }, [loginUser?.userType, loginUser?.facultyType, router]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesLoadError, setCoursesLoadError] = useState(false);
  const [coursesRetryCount, setCoursesRetryCount] = useState(0);
  const [api, contextHolder] = notification.useNotification();

  const isLearner = String(loginUser?.userType || "").toUpperCase() === "LEARNER";

  const selectedCourse = studentData?.selectedCourse;
  const selectedCourseId = selectedCourse?.id ?? selectedCourse?.value;
  const dateRaw = studentData?.date;
  const date = dateRaw ? moment(dateRaw) : moment();
  const dateKey = date.format("YYYY-MM");

  useEffect(() => {
    if (!isLearner) return;
    let cancelled = false;
    setCoursesLoading(true);
    setCoursesLoadError(false);
    getLearnerAttendanceCourses()
      .then((options) => {
        if (cancelled) return;
        const list = Array.isArray(options) ? options : [];
        setCourses(list);
        setCoursesLoadError(false);
        // BE-0001: a remembered course that is no longer in the list is replaced (or cleared), never kept and re-requested.
        const stillThere = selectedCourseId && list.some((c) => (c.id ?? c.value) === selectedCourseId);
        if (list.length > 0 && !stillThere) {
          dispatch(attendanceAction.handleStudentData({ key: "selectedCourse", value: list[0] }));
        } else if (list.length === 0 && selectedCourseId) {
          dispatch(attendanceAction.handleStudentData({ key: "selectedCourse", value: null }));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Do not let a request failure collapse into the Select's "You're not enrolled" empty
        // state. A transport/permission failure is unknown course state, not proof of zero courses.
        setCoursesLoadError(true);
        api.error({
          message: "Could not load courses",
          description: err?.response?.status === 403 ? "You don't have access to courses." : "Something went wrong on our end. Retry to load your courses.",
          icon: <ExclamationCircleOutlined style={{ color: "#ef4444" }} />,
          placement: "bottomRight",
          duration: 5,
        });
      })
      .finally(() => {
        if (!cancelled) setCoursesLoading(false);
      });
    return () => { cancelled = true; };
  }, [isLearner, coursesRetryCount]);

  // A learner's records are asked for only once the course is confirmed in their current list (BE-0001).
  const recordsCourseId = !isLearner || courses.some((c) => (c.id ?? c.value) === selectedCourseId) ? selectedCourseId : null;

  useEffect(() => {
    if (!recordsCourseId) {
      setAttendanceData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setAttendanceLoadError(false);
    const startDate = moment(dateRaw || undefined).startOf("month").format("YYYY-MM-DD");
    const endDate = moment(dateRaw || undefined).endOf("month").format("YYYY-MM-DD");
    getLearnerAttendanceRecords({
      courseId: Number(recordsCourseId),
      startDate,
      endDate,
    })
      .then((resData) => {
        if (cancelled) return;
        setAttendanceData(resData ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setAttendanceData(null);
        setAttendanceLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [recordsCourseId, dateKey, attendanceRetryCount]);

  const classes = attendanceData?.classes?.length > 0 ? attendanceData.classes : [];
  const absentIds = attendanceData?.absentids || [];
  // Future and never-marked sessions are neither Present nor Absent (LRN-AT-01); presentCount used to
  // be "every class minus absences", counting both as attended.
  const nowRef = dayjs();
  const statusOf = (c) => learnerSessionStatus(c, absentIds, nowRef);
  const tally = learnerAttendanceTally(classes, absentIds, nowRef);
  const presentCount = tally.present;
  const absentCount = tally.absent;

  const presentPopover = useMemo(() => {
    const presentClasses = classes.filter((c) => statusOf(c).key === "present");
    if (presentClasses.length === 0) return null;
    const recent = presentClasses.slice(-10).reverse();
    return (
      <ul className="metric-popover-list">
        {recent.map((c) => (
          <li key={c?.classScheduleId} className="metric-popover-item">
            <span className="metric-popover-item__name">{dayjs(c?.startTime).format("ddd, MMM D")}</span>
            <span className="metric-popover-item__value">{dayjs(c?.startTime).format("h:mm A")}</span>
          </li>
        ))}
        {presentClasses.length > 10 && (
          <li className="metric-popover-item">
            <span className="metric-popover-item__name" style={{ color: "#94a3b8", fontStyle: "italic" }}>
              +{presentClasses.length - 10} more
            </span>
          </li>
        )}
      </ul>
    );
  }, [classes, absentIds]);

  const absentPopover = useMemo(() => {
    const absentClasses = classes.filter((c) => statusOf(c).key === "absent");
    if (absentClasses.length === 0) return null;
    return (
      <ul className="metric-popover-list">
        {absentClasses.map((c) => (
          <li key={c?.classScheduleId} className="metric-popover-item">
            <span className="metric-popover-item__name">{dayjs(c?.startTime).format("ddd, MMM D")}</span>
            <span className="metric-popover-item__value">{dayjs(c?.startTime).format("h:mm A")}</span>
          </li>
        ))}
      </ul>
    );
  }, [classes, absentIds]);

  const handleCourseChange = useCallback(
    (value) => {
      const option = courses.find((c) => (c.id ?? c.value) === value);
      if (option) {
        dispatch(attendanceAction.handleStudentData({ key: "selectedCourse", value: option }));
      }
    },
    [dispatch, courses]
  );

  const courseOptions = courses.map((c) => ({
    label: c.label ?? c.name ?? c.courseName ?? `Course ${c.id ?? c.value}`,
    value: c.id ?? c.value,
  }));

  // Redux's selectedCourse can already hold an id from a previous mount (in-memory store
  // survives SPA route changes) while this component's local `courses` list is still `[]`
  // right after remount and the fetch above hasn't resolved yet. Passing that id straight
  // through as Select's `value` before a matching option exists makes antd fall back to
  // rendering the raw id as text — the "course id flashes before the name" bug. Only pass
  // a value once it actually resolves to an option; otherwise let the Select show its
  // loading/placeholder state.
  const selectedCourseValue = courseOptions.some((o) => o.value === selectedCourseId)
    ? selectedCourseId
    : undefined;

  const handlePrevMonth = useCallback(() => {
    const dt = moment(date).subtract(1, "months").toDate();
    dispatch(attendanceAction.handleStudentData({ key: "date", value: dt.toISOString() }));
  }, [date, dispatch]);

  const handleNextMonth = useCallback(() => {
    const dt = moment(date).add(1, "months").toDate();
    dispatch(attendanceAction.handleStudentData({ key: "date", value: dt.toISOString() }));
  }, [date, dispatch]);

  // Jumping several months with only prev/next arrows takes one click per month, so give a
  // direct month/year picker alongside the arrows for going further back or forward at once.
  const handleMonthPick = useCallback(
    (value) => {
      if (!value) return;
      dispatch(attendanceAction.handleStudentData({ key: "date", value: value.toDate().toISOString() }));
    },
    [dispatch]
  );

  const emptySelectCourse = (
    <div className="learn-attendance-empty learn-attendance-empty--rich">
      <div className="learn-attendance-empty__illustration">
        <AttendanceEmptyIllustration />
      </div>
      <h4 className="learn-attendance-empty__title ln-lto-bold">Select a course</h4>
      <p className="learn-attendance-empty__subtitle ln-lto-reg">
        Choose a course from the dropdown above to view your attendance records.
      </p>
    </div>
  );

  const attendanceLoadErrorState = (
    <div className="learn-attendance-empty learn-attendance-empty--rich">
      <div className="learn-attendance-empty__illustration">
        <AttendanceEmptyIllustration />
      </div>
      <h4 className="learn-attendance-empty__title ln-lto-bold">Couldn&apos;t load attendance</h4>
      <p className="learn-attendance-empty__subtitle ln-lto-reg">
        Something went wrong loading attendance for this month.
      </p>
      <Button onClick={() => setAttendanceRetryCount((count) => count + 1)}>Retry</Button>
    </div>
  );

  const emptyNoRecords = (
    <div className="learn-attendance-empty learn-attendance-empty--rich">
      <div className="learn-attendance-empty__illustration">
        <AttendanceEmptyIllustration />
      </div>
      <h4 className="learn-attendance-empty__title ln-lto-bold">No attendance records</h4>
      <p className="learn-attendance-empty__subtitle ln-lto-reg">
        No classes scheduled for this month. Try selecting a different period.
      </p>
    </div>
  );

  const tableColumns = [
    {
      title: "Date",
      dataIndex: "date",
      render: (_, ele) => <span>{dayjs(ele?.startTime).format("YYYY MMMM D")}</span>,
    },
    {
      title: "Day",
      dataIndex: "weekDay",
      render: (_, ele) => <span>{dayjs(ele?.startTime).format("dddd")}</span>,
    },
    {
      title: "Class Start Time",
      dataIndex: "startTime",
      render: (_, ele) => <span>{dayjs(ele?.startTime).format("h:mm A")}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_, ele) => {
        const status = statusOf(ele);
        return <StatusCol statusClass={status.statusClass} status={status.label} />;
      },
    },
  ];

  if (!isLearner) return null;

  return (
    <>
      {contextHolder}
      <div className="scroll-container learn-attendance-page learn-attendance-page--scroll learn-placements-dashboard">
        <PageShell>
            {/* Compact header with metric pills */}
            <ListingPageHeader
              title="Attendance"
              ariaLabel="Attendance overview"
              metrics={classes.length > 0 && (
                <>
                  <MetricPill
                    icon={<BookOutlined />}
                    label={`${classes.length} Total`}
                    variant="teal"
                  />
                  <MetricPill
                    icon={<CheckCircleOutlined />}
                    label={`${presentCount} Present`}
                    variant="green"
                    popoverTitle="Recent Present Dates"
                    popover={presentPopover}
                  />
                  <MetricPill
                    icon={<CloseCircleOutlined />}
                    label={`${absentCount} Absent`}
                    variant="amber"
                    popoverTitle="Absent Dates"
                    popover={absentPopover}
                  />
                </>
              )}
            />

            {/* Attendance records section — no wrapper stat cards */}
            <section className="learn-attendance-grid-section" aria-label="Attendance records">
              {coursesLoadError && (
                <Alert
                  type="warning"
                  showIcon
                  className="mb-3"
                  message="Course list unavailable"
                  description={courses.length > 0
                    ? "Showing the last course list we loaded. Retry to make sure it is up to date."
                    : "We couldn't verify your enrolled courses. This is a loading problem, not an empty course list."}
                  action={<Button size="small" onClick={() => setCoursesRetryCount((count) => count + 1)}>Retry</Button>}
                />
              )}
              <div className="learn-attendance-filter-bar">
                <div className="learn-attendance-filter-course">
                  <BookOutlined className="learn-attendance-filter-course__icon" />
                  <span className="learn-attendance-filter-course__label">Course</span>
                  <Select
                    value={selectedCourseValue}
                    onChange={handleCourseChange}
                    options={courseOptions}
                    placeholder={coursesLoadError ? "Courses unavailable" : "Select course"}
                    loading={coursesLoading}
                    disabled={coursesLoadError && courses.length === 0}
                    notFoundContent={coursesLoadError ? "Couldn't load your courses" : "You're not enrolled in any courses yet"}
                    className="learn-attendance-filter-course__select"
                    suffixIcon={null}
                    bordered={false}
                  />
                </div>
                <div className="learn-attendance-filter-date">
                  <button type="button" className="learn-attendance-filter-date__nav" onClick={handlePrevMonth} aria-label="Previous month">
                    <LeftOutlined />
                  </button>
                  <DatePicker
                    picker="month"
                    value={dayjs(date.toDate())}
                    onChange={handleMonthPick}
                    allowClear={false}
                    bordered={false}
                    inputReadOnly
                    format="MMMM YYYY"
                    className="learn-attendance-filter-date__picker"
                    suffixIcon={null}
                    aria-label="Jump to month"
                  />
                  <button type="button" className="learn-attendance-filter-date__nav" onClick={handleNextMonth} aria-label="Next month">
                    <RightOutlined />
                  </button>
                </div>
              </div>
              <div className="ln-module-card learn-placements-section-card learn-attendance-list-card"
                aria-busy={loading ? "true" : undefined}>
                {!selectedCourseId && coursesLoadError ? (
                  <div className="learn-attendance-empty learn-attendance-empty--rich" role="alert">
                    <h4 className="learn-attendance-empty__title ln-lto-bold">Couldn&apos;t load your courses</h4>
                    <p className="learn-attendance-empty__subtitle ln-lto-reg">This is a loading problem, not missing enrolment.</p>
                    <Button onClick={() => setCoursesRetryCount((n) => n + 1)}>Retry</Button>
                  </div>
                ) : !selectedCourseId ? (
                  emptySelectCourse
                ) : loading && classes.length === 0 ? (
                  <div className="learn-attendance-loading">
                    <TableSkeleton rows={5} columns={5}
                      label={`Loading attendance for ${date.format("MMMM YYYY")}`} />
                  </div>
                ) : attendanceLoadError ? (
                  attendanceLoadErrorState
                ) : classes.length === 0 ? (
                  emptyNoRecords
                ) : (
                  <>
                    {loading && classes.length > 0 && (
                      <RefreshStatus label={`Updating attendance for ${date.format("MMMM YYYY")}…`} />
                    )}
                    <div className="learn-attendance-desktop">
                      <Table
                        scroll={{ x: "max-content" }}
                        className="learn-attendance-table"
                        columns={tableColumns}
                        dataSource={classes}
                        rowKey={(r, index) => r?.classScheduleId ?? r?.startTime ?? index}
                        pagination={false}
                      />
                    </div>
                    <div className="learn-attendance-mobile">
                      <ul className="learn-attendance-list">
                        {classes.map((ele) => {
                          return (
                            <li key={ele?.classScheduleId ?? ele?.startTime} className="learn-attendance-list__item">
                              <AttendanceListItem record={ele} status={statusOf(ele)} />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </section>
        </PageShell>
      </div>
    </>
  );
}
