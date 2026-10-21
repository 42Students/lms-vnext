import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import { Spin, Alert, Typography, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

import CalendarContext from "@/contexts/calendar-context";
import { getCalenderEvents } from "@/api/Services/calenderServices";
import { getCalendarCourseColor } from "@/utils/helper";
import StandardCalendar from "@/components/CalendarComp/StandardCalendar";
import CalendarMobileList from "@/components/CalendarComp/CalendarMobileList/CalendarMobileList";
import CalendarErrorBoundary from "@/components/ErrorBoundary/CalendarErrorBoundary";
import useLearnerClassScope from "@/hooks/useLearnerClassScope";

const { Text } = Typography;
const FALLBACK_EVENT_COLOR = "#5B8DEE";

/** Format date as yyyy-MM-dd for backend. */
function toYYYYMMDD(m) {
  return moment(m).format("YYYY-MM-DD");
}

/** Safely parse a date string and validate. Returns Date or null. */
function safeParseDate(raw) {
  if (raw == null || raw === "") return null;
  const parsed = moment(raw, [
    moment.ISO_8601,
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DDTHH:mm:ss",
    "YYYY-MM-DDTHH:mm:ss.SSS",
  ], true);
  const d = (parsed.isValid() ? parsed : moment(raw)).toDate();
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Academic Calendar Events — displays class/course schedule events.
 * Uses the shared StandardCalendar component.
 * Shows loading, error, and empty states for better UX.
 * @param {Object} [props]
 * @param {Function} [props.onEventsChange] - Called when events are loaded (events: Array)
 */
const CalendarEvents = ({ onEventsChange, onSelectEvent }) => {
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const loginUser = useSelector((state) => state.loginUser);
  const isTeacherRole = loginUser?.userType === "FACULTY";
  const { status: classStatus, retry: retryClass } = useLearnerClassScope({ enabled: !isTeacherRole });
  const { activeCalendarState, onNavigate, onView } = useContext(CalendarContext);
  const filteredCourses = activeCalendarState?.filteredCourses ?? [];
  const filteredCoursesRef = useRef([]);
  filteredCoursesRef.current = filteredCourses;
  const abortRef = useRef(null);
  const fetchSeqRef = useRef(0);

  const canFetch = isTeacherRole
    ? loginUser?.id != null && loginUser?.id !== ""
    : loginUser?.classId != null && loginUser?.classId !== "";

  const fetchClassSchedule = useCallback(() => {
    if (!activeCalendarState?.date) return;
    if (!canFetch) {
      setEventsData([]);
      return;
    }

    const date = activeCalendarState.date;
    const currentView = activeCalendarState.view;
    let startDate = "";
    let endDate = "";

    if (currentView === "day") {
      startDate = toYYYYMMDD(date);
      endDate = toYYYYMMDD(date);
    } else if (currentView === "week") {
      // Extend to cover full weeks that react-big-calendar renders
      startDate = toYYYYMMDD(moment(date).startOf("week"));
      endDate = toYYYYMMDD(moment(date).endOf("week"));
    } else if (currentView === "month") {
      // Extend range to cover overflow weeks that react-big-calendar shows
      startDate = toYYYYMMDD(moment(date).startOf("month").startOf("week"));
      endDate = toYYYYMMDD(moment(date).endOf("month").endOf("week"));
    }

    const eventParams = { startDate, endDate };
    if (isTeacherRole) {
      eventParams.facultyId = loginUser?.id;
    } else {
      eventParams.classId = loginUser?.classId;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setFetchError(null);
    getCalenderEvents(eventParams, isTeacherRole, signal)
      .then((eventRes) => {
        if (signal.aborted || seq !== fetchSeqRef.current) return;
        // calenderServices returns response.data, so eventRes IS the data payload
        const list = Array.isArray(eventRes?.data) ? eventRes.data
          : Array.isArray(eventRes) ? eventRes
          : null;
        if (!list) throw new Error("Invalid class schedule payload");
        const courseColorMap = Object.fromEntries(
          filteredCoursesRef.current.filter((c) => c?.id != null && c?.color).map((c) => [String(c.id), c.color])
        );
        const classEvents = list
          .map((ele, idx) => {
            const start = safeParseDate(ele.startTime);
            const end = safeParseDate(ele.endTime);
            if (!start || !end) return null;
            // Validate end > start
            if (end.getTime() <= start.getTime()) return null;
            const courseId = ele.courseId ?? ele.course_id;
            const courseSlug = ele.courseSlug ?? ele.course_slug ?? null;
            const courseName = ele.courseName || "";
            const scheduleTitle = ele.title || "";
            const className = ele.className || "";
            let displayTitle = scheduleTitle || courseName || "Scheduled Class";
            if (scheduleTitle && courseName && scheduleTitle !== courseName) {
              displayTitle = `${scheduleTitle} · ${courseName}`;
            }
            if (className && !displayTitle.includes(className)) {
              displayTitle += ` (${className})`;
            }
            const eventColor =
              (courseId != null && String(courseId) !== "0" && courseColorMap[String(courseId)]) ||
              getCalendarCourseColor(courseId ?? courseName);
            // Use a robust unique ID — avoid falsy collisions
            const eventId = ele.classScheduleId || ele.id || `schedule-${idx}`;
            return {
              id: eventId,
              title: displayTitle,
              start,
              end,
              allDay: false,
              courseId,
              courseSlug,
              courseName,
              className,
              scheduleTitle,
              color: eventColor,
            };
          })
          .filter(Boolean);
        setEventsData(classEvents);
      })
      .catch((err) => {
        if (signal.aborted || seq !== fetchSeqRef.current) return;
        setFetchError("Unable to load class schedule. Please try again.");
      })
      .finally(() => {
        if (!signal.aborted && seq === fetchSeqRef.current) setLoading(false);
      });
  }, [
    activeCalendarState?.date,
    activeCalendarState?.view,
    isTeacherRole,
    loginUser?.id,
    loginUser?.classId,
    canFetch,
  ]);

  useEffect(() => {
    fetchClassSchedule();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchClassSchedule]);

  useEffect(() => {
    if (Array.isArray(eventsData)) onEventsChange?.(eventsData);
  }, [eventsData, onEventsChange]);

  const onDrillDown = useCallback(
    (newDate) => {
      onNavigate(newDate);
      onView("day");
    },
    [onNavigate, onView]
  );

  const eventPropGetter = useCallback((event) => {
    const baseColor = event.color || FALLBACK_EVENT_COLOR;
    return {
      style: {
        backgroundColor: `${baseColor}20`,
        color: "#1a1a2e",
        borderLeft: `4px solid ${baseColor}`,
        borderColor: baseColor,
      },
    };
  }, []);

  if (!canFetch) {
    // LRN-CAL-01: a classId missing from login state is loaded first; only a learner who really has
    // no class is told so, and a failed lookup offers Retry instead of a false "not assigned".
    if (!isTeacherRole && classStatus === "loading") {
      return <div className="learn-calendar-empty-desktop"><Spin /></div>;
    }
    if (!isTeacherRole && classStatus === "error") {
      return (
        <div className="learn-calendar-empty-desktop">
          <Alert type="warning" showIcon message="Couldn't load your class, so the schedule can't be shown"
            action={<Button size="small" onClick={retryClass}>Retry</Button>} />
        </div>
      );
    }
    const hint = isTeacherRole
      ? "Your faculty ID is not set. Contact your administrator."
      : "You are not assigned to a class yet. Your schedule will appear here once your class assignment is complete.";
    return (
      <div className="learn-calendar-empty-desktop">
        <Text type="secondary">{hint}</Text>
      </div>
    );
  }

  if (loading && eventsData.length === 0) {
    return (
      <div className="learn-calendar-empty-desktop" style={{ padding: "80px 24px" }}>
        <Spin size="large">
          <div style={{ padding: 16, color: "#64748b", fontSize: 14 }}>Loading schedule...</div>
        </Spin>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="learn-calendar-error-wrap" style={{ padding: 24 }}>
        <Alert
          type="warning"
          message={fetchError}
          showIcon
          closable
          onClose={() => setFetchError(null)}
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => fetchClassSchedule()}
            >
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      {loading && eventsData.length > 0 && (
        <div style={{ textAlign: "center", padding: "4px 0" }}>
          <Spin size="small" />
        </div>
      )}
      <div className="learn-calendar-desktop">
        <CalendarErrorBoundary>
          <StandardCalendar
            events={filteredCoursesRef.current.length > 0
              ? eventsData.filter(ev => {
                  const c = filteredCourses.find(fc => fc.id === ev.courseId);
                  return c == null || c.checked !== false;
                })
              : eventsData}
            date={activeCalendarState?.date}
            view={activeCalendarState?.view}
            onNavigate={onNavigate}
            onView={onView}
            onDrillDown={onDrillDown}
            onSelectEvent={onSelectEvent}
            eventPropGetter={eventPropGetter}
          />
        </CalendarErrorBoundary>
      </div>
      <div className="learn-calendar-mobile">
        <CalendarMobileList
          events={filteredCoursesRef.current.length > 0
            ? eventsData.filter(ev => {
                const c = filteredCoursesRef.current.find(fc => fc.id === ev.courseId);
                return c == null || c.checked !== false;
              })
            : eventsData}
          date={activeCalendarState?.date}
          view={activeCalendarState?.view}
          onNavigate={onNavigate}
          onView={onView}
          onSelectEvent={onSelectEvent}
          eventPropGetter={eventPropGetter}
          loading={loading}
          emptyMessage={`No scheduled classes this ${activeCalendarState?.view === "day" ? "day" : activeCalendarState?.view || "week"}.`}
        />
      </div>
    </>
  );
};

export default CalendarEvents;
