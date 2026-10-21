import React, { useContext, useEffect, useCallback, useMemo, useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { Alert, Skeleton, Select, Button } from "antd";
import { LeftOutlined, RightOutlined, CalendarOutlined, ScheduleOutlined } from "@ant-design/icons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import PageShell from "@/components/Common/PageShell";
import MetricPill from "@/components/Global/MetricPill/MetricPill";
import CalendarContext from "@/contexts/calendar-context";
import useCourses from "@/hooks/useCourses";
import { getCalendarCourseColor } from "@/utils/helper";
import { getCalenderEvents } from "@/api/Services/calenderServices";

import CalendarEvents from "@/components/CalendarComp/CalendarEvents/CalendarEvents";
import styles from "@/styles/modules/calendar.module.scss";

const ClassScheduleContent = () => {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const isTeacherRole = loginUser?.userType === "FACULTY";
  const [modifiedCourses, , coursesLoading, coursesError] = useCourses();
  const { activeCalendarState, calendarStateHandler, resetCalendarState, onNavigate, onView } =
    useContext(CalendarContext);
  const [nextThreeClasses, setNextThreeClasses] = useState([]);
  // A failed "next classes" fetch used to just render nothing, indistinguishable from "no classes".
  const [upcomingError, setUpcomingError] = useState(false);
  // Today's classes, from the same fixed 180-day window as nextThreeClasses — NOT from `events`,
  // which is scoped to whatever month/week/day the calendar grid currently has navigated to. The
  // "N today" / "Next: ..." pills previously read off `events`, so paging the calendar forward
  // silently zeroed them out even though today's real classes hadn't changed.
  const [todaysClasses, setTodaysClasses] = useState([]);

  const { view, date } = activeCalendarState;

  const canFetchUpcoming = isTeacherRole
    ? loginUser?.id != null && loginUser?.id !== ""
    : loginUser?.classId != null && loginUser?.classId !== "";

  // Reset calendar state then immediately set courses to avoid race condition
  const initializedRef = React.useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      resetCalendarState();
      initializedRef.current = true;
    }
    const cList = (modifiedCourses || []).map((courseItem) => {
      const hexColorCode = getCalendarCourseColor(courseItem.id ?? courseItem.name);
      return {
        ...courseItem,
        [`id_${courseItem.id}`]: hexColorCode,
        color: hexColorCode,
        checked: true,
      };
    });
    calendarStateHandler({
      courses: cList,
      originalCourses: cList,
      filteredCourses: cList,
    });
  }, [modifiedCourses, calendarStateHandler, resetCalendarState]);

  const handleSelectEvent = useCallback((event) => {
    if (!event.courseId && !event.courseSlug) return;
    const base = isTeacherRole ? "/teacher" : "/learn";
    // A bare numeric course id in the URL is ambiguous on the faculty course-tab route: it's
    // resolved first as a teaching-assignment mapping id, and only falls back to a real course
    // id lookup if no matching assignment row exists for this faculty (see
    // resolveNumericFacultyCourse / courseHref's own "?ref=course" contract, which every other
    // faculty course link already follows). Without this, a click here could silently land on a
    // faculty member's unrelated course whose assignment id happens to collide with this one.
    const identifier = event.courseSlug || event.courseId;
    // Straight to /home, not the bare course path -- that route only ever client-redirects to
    // /home itself (see courseHref's own comment on this), so linking to it directly here would
    // cost this click an extra mount + skeleton flash for no reason.
    const path = `${base}/courses/${encodeURIComponent(String(identifier))}/home`;
    const needsRefMarker = isTeacherRole && !event.courseSlug;
    router.push(needsRefMarker ? `${path}?ref=course` : path);
  }, [isTeacherRole, router]);

  // The events grid (CalendarEvents.js) already filters by activeCalendarState.filteredCourses'
  // per-course `checked` flag -- that plumbing was built but never had a control wired to it, so
  // faculty always saw every course's classes mixed together with no way to isolate one. Defaults
  // to all checked, matching the existing "show all" initial state above.
  const courseFilterOptions = useMemo(
    () => (activeCalendarState.courses || []).map((c) => ({ value: c.id, label: c.name })),
    [activeCalendarState.courses]
  );
  const selectedCourseIds = useMemo(
    () => (activeCalendarState.courses || []).filter((c) => c.checked !== false).map((c) => c.id),
    [activeCalendarState.courses]
  );
  const handleCourseFilterChange = useCallback(
    (selectedIds) => {
      const idSet = new Set(selectedIds);
      const updated = (activeCalendarState.courses || []).map((c) => ({ ...c, checked: idSet.has(c.id) }));
      calendarStateHandler({ courses: updated, filteredCourses: updated });
    },
    [activeCalendarState.courses, calendarStateHandler]
  );

  const handleViewChange = useCallback((value) => onView(value), [onView]);
  const goToday = useCallback(() => onNavigate(new Date()), [onNavigate]);
  const goPrev = useCallback(() => {
    const unit = view === "month" ? "months" : view === "day" ? "days" : "weeks";
    onNavigate(new Date(moment(date).subtract(1, unit)));
  }, [view, date, onNavigate]);
  const goNext = useCallback(() => {
    const unit = view === "month" ? "months" : view === "day" ? "days" : "weeks";
    onNavigate(new Date(moment(date).add(1, unit)));
  }, [view, date, onNavigate]);

  const handleKeyNav = useCallback((e, action) => {
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  }, []);

  useEffect(() => {
    if (!canFetchUpcoming) {
      setNextThreeClasses([]);
      return;
    }

    const controller = new AbortController();
    setUpcomingError(false);
    const params = {
      startDate: moment().format("YYYY-MM-DD"),
      endDate: moment().add(180, "days").format("YYYY-MM-DD"),
    };
    if (isTeacherRole) {
      params.facultyId = loginUser?.id;
    } else {
      params.classId = loginUser?.classId;
    }

    getCalenderEvents(params, isTeacherRole, controller.signal)
      .then((eventRes) => {
        const list = Array.isArray(eventRes?.data) ? eventRes.data
          : Array.isArray(eventRes) ? eventRes
          : null;
        if (!list) throw new Error("Invalid upcoming class schedule payload");
        const mapped = list
          .map((item, index) => {
            const startMoment = moment(item?.startTime);
            const endMoment = moment(item?.endTime);
            if (!startMoment.isValid() || !endMoment.isValid()) return null;
            const courseId = item?.courseId ?? item?.course_id;
            const courseSlug = item?.courseSlug ?? item?.course_slug ?? null;
            const scheduleTitle = item?.title || "";
            const courseName = item?.courseName || "";
            let title = scheduleTitle || courseName || "Scheduled Class";
            if (scheduleTitle && courseName && scheduleTitle !== courseName) {
              title = `${scheduleTitle} · ${courseName}`;
            }
            return {
              id: item?.classScheduleId || item?.id || `upcoming-${index}`,
              title,
              courseId,
              courseSlug,
              courseName,
              facultyName: item?.facultyName,
              location: item?.location,
              startMoment,
              endMoment,
              start: startMoment.toDate(),
              end: endMoment.toDate(),
            };
          })
          .filter(Boolean);
        const today = moment().format("YYYY-MM-DD");
        setTodaysClasses(
          mapped
            .filter((ev) => ev.startMoment.format("YYYY-MM-DD") === today)
            .sort((a, b) => a.startMoment.valueOf() - b.startMoment.valueOf())
        );
        setNextThreeClasses(
          mapped
            .filter((ev) => ev.endMoment.isAfter(moment()))
            .sort((a, b) => a.startMoment.valueOf() - b.startMoment.valueOf())
            .slice(0, 3)
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setNextThreeClasses([]);
          setTodaysClasses([]);
          setUpcomingError(true);
        }
      });

    return () => controller.abort();
  }, [canFetchUpcoming, isTeacherRole, loginUser?.id, loginUser?.classId]);

  const eventsToday = todaysClasses;

  const nextUpEvent = useMemo(() => {
    const now = moment();
    return nextThreeClasses.find((ev) => ev.startMoment.isAfter(now)) ?? null;
  }, [nextThreeClasses]);

  const upcomingClasses = useMemo(() => {
    return nextThreeClasses;
  }, [nextThreeClasses]);

  const nextUpDisplay = useMemo(() => {
    if (!nextUpEvent) {
      return { value: "—", label: eventsToday.length > 0 ? "All done for today" : "No classes in view" };
    }
    const m = nextUpEvent.startMoment;
    const courseName = nextUpEvent.courseName || nextUpEvent.title || "Class";
    const shortName = courseName.length > 18 ? `${courseName.slice(0, 16)}\u2026` : courseName;
    const today = moment().format("YYYY-MM-DD");
    const tomorrow = moment().add(1, "day").format("YYYY-MM-DD");
    const dateStr = m.format("YYYY-MM-DD");
    let value;
    if (dateStr === today) {
      value = m.format("h:mm A");
    } else if (dateStr === tomorrow) {
      value = `Tomorrow ${m.format("h:mm A")}`;
    } else {
      value = m.format("ddd h:mm A");
    }
    return { value, label: shortName };
  }, [nextUpEvent, eventsToday.length]);

  const todayPopover = useMemo(() => {
    if (eventsToday.length === 0) return null;
    return (
      <ul className="metric-popover-list">
        {eventsToday.map((ev, i) => {
          const start = ev.start instanceof Date ? ev.start : new Date(ev.start);
          const time = moment(start).format("h:mm A");
          const name = ev.courseName || ev.title || "Class";
          return (
            <li key={ev.id ?? i} className="metric-popover-item">
              <span className="metric-popover-item__name">{name}</span>
              <span className="metric-popover-item__value">{time}</span>
            </li>
          );
        })}
      </ul>
    );
  }, [eventsToday]);

  const nextUpPopover = useMemo(() => {
    if (!nextUpEvent) return null;
    const m = nextUpEvent.startMoment;
    const name = nextUpEvent.courseName || nextUpEvent.title || "Class";
    return (
      <div className="metric-popover-info">
        <p><strong>Course:</strong> {name}</p>
        <p><strong>Time:</strong> {m.format("h:mm A")}</p>
        <p><strong>Date:</strong> {m.format("ddd, MMM D, YYYY")}</p>
        {nextUpEvent.facultyName && <p><strong>Faculty:</strong> {nextUpEvent.facultyName}</p>}
        {nextUpEvent.location && <p><strong>Room:</strong> {nextUpEvent.location}</p>}
      </div>
    );
  }, [nextUpEvent]);

  const renderToolbar = () => (
    <div className="learn-class-schedule-toolbar">
      <div className="learn-class-schedule-toolbar__nav">
        <div className="learn-class-schedule-toolbar__accent" aria-hidden />
        <button
          type="button"
          className="learn-class-schedule-toolbar__arrow"
          onClick={goPrev}
          onKeyDown={(e) => handleKeyNav(e, goPrev)}
          aria-label="Previous period"
        >
          <LeftOutlined aria-hidden />
        </button>
        <span className="learn-class-schedule-toolbar__label">
          {view === "month"
            ? moment(date).format("MMMM YYYY")
            : view === "week"
              ? `${moment(date).startOf("week").format("MMM D")} – ${moment(date).endOf("week").format("MMM D, YYYY")}`
              : moment(date).format("ddd, MMM D, YYYY")}
        </span>
        <button
          type="button"
          className="learn-class-schedule-toolbar__arrow"
          onClick={goNext}
          onKeyDown={(e) => handleKeyNav(e, goNext)}
          aria-label="Next period"
        >
          <RightOutlined aria-hidden />
        </button>
      </div>
      <div className="learn-class-schedule-toolbar__actions">
        {courseFilterOptions.length > 1 && (
          <Select
            mode="multiple"
            value={selectedCourseIds}
            onChange={handleCourseFilterChange}
            options={courseFilterOptions}
            placeholder="All courses"
            maxTagCount="responsive"
            allowClear
            aria-label="Filter calendar by course"
            className="learn-class-schedule-toolbar__course-filter"
          />
        )}
        <Button size="middle" onClick={goToday} className="learn-class-schedule-toolbar__today">
          Today
        </Button>
        <Select
          value={view}
          onChange={handleViewChange}
          options={[
            { value: "month", label: "Month" },
            { value: "week", label: "Week" },
            { value: "day", label: "Day" },
          ]}
          className="learn-class-schedule-toolbar__view"
          aria-label="Calendar view"
        />
      </div>
    </div>
  );

  if (coursesLoading) {
    return (
      <div className="scroll-container learn-class-schedule-page learn-class-schedule-page--scroll learn-placements-dashboard">
        <PageShell>
            <ListingPageHeader title="Class Schedule" ariaLabel="Class schedule overview" />
            <section
              className="learn-class-schedule-grid-section"
              aria-busy="true"
              role="status"
              aria-live="polite"
            >
              <span className="sr-only">Loading class schedule</span>
              <div className="learn-class-schedule-loading" aria-hidden="true">
                <div className="learn-class-schedule-skeleton">
                  <Skeleton.Input active size="small" style={{ width: 200, marginBottom: 16 }} />
                  <div className="learn-class-schedule-skeleton__grid">
                    {[...Array(7)].map((_, i) => (
                      <Skeleton.Button active key={i} style={{ width: "100%", height: 32 }} />
                    ))}
                    {[...Array(21)].map((_, i) => (
                      <Skeleton.Input active key={`c${i}`} size="small" style={{ width: "100%", height: 48 }} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="scroll-container learn-class-schedule-page learn-class-schedule-page--scroll learn-placements-dashboard">
      <PageShell>
          {/* Compact header with metric pills */}
          <ListingPageHeader
            title="Class Schedule"
            ariaLabel="Class schedule overview"
            metrics={(todaysClasses.length > 0 || nextThreeClasses.length > 0) && (
              <>
                <MetricPill
                  icon={<CalendarOutlined />}
                  label={`${eventsToday.length} today`}
                  variant="teal"
                  popoverTitle="Today's Classes"
                  popover={todayPopover}
                />
                {nextUpEvent && (
                  <MetricPill
                    icon={<ScheduleOutlined />}
                    label={`Next: ${nextUpDisplay.value}`}
                    variant="green"
                    popoverTitle={nextUpDisplay.label}
                    popover={nextUpPopover}
                  />
                )}
              </>
            )}
          />

          {/* Calendar section — no wrapper card stat cards */}
          <section className="learn-class-schedule-grid-section" aria-label="Calendar">
            {coursesError && (
              <Alert
                type="warning"
                message="Failed to load course data"
                description="Calendar events may be incomplete. Please try refreshing the page."
                showIcon
                closable
                className="learn-class-schedule-alert"
              />
            )}
            {upcomingError && (
              <Alert
                type="warning"
                message="Couldn't load your next classes"
                description="The calendar below may still show them. Refresh the page to try again."
                showIcon
                closable
                className="learn-class-schedule-alert"
              />
            )}
            {upcomingClasses.length > 0 && (
              <div className="learn-class-schedule-upcoming" aria-label="Next upcoming classes">
                <div className="learn-class-schedule-upcoming__head">
                  <span>Next classes</span>
                  <strong>Next 3 upcoming</strong>
                </div>
                <div className="learn-class-schedule-upcoming__list">
                  {upcomingClasses.map((item, index) => (
                    <button
                      type="button"
                      key={item.id ?? `${item.courseId}-${item.startMoment.valueOf()}-${index}`}
                      className="learn-class-schedule-upcoming__item"
                      onClick={() => handleSelectEvent(item)}
                    >
                      <span>{item.startMoment.format("ddd, MMM D")}</span>
                      <strong>{item.courseName || item.title || "Class"}</strong>
                      <small>{item.startMoment.format("h:mm A")}{item.facultyName ? ` · ${item.facultyName}` : ""}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="ln-module-card learn-placements-section-card learn-class-schedule-card">
              {renderToolbar()}
              <div className={`${styles.mainWrapper} calendar-wrapper learn-class-schedule-content`}>
                <CalendarEvents onSelectEvent={handleSelectEvent} />
              </div>
            </div>
          </section>
      </PageShell>
    </div>
  );
};

export default ClassScheduleContent;
