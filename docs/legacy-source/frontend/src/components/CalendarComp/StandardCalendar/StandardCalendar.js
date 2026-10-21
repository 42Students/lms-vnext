import React, { useMemo, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { Tooltip } from "antd";

import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "../CalendarEvents/CalendarEvents.module.scss";
import MyWeekHeader from "../MyWeekHeader/MyWeekHeader";

/**
 * Single shared calendar component used across the app.
 * - Academic Calendar (class schedule): uses this with CalendarContext + class events.
 * - Career Calendar: uses this with local state + career events.
 * - Admin Interview Calendar: uses this with local state + interview events.
 */

const localizer = momentLocalizer(moment);

const FALLBACK_COLOR = "#5B8DEE";
const NOOP = () => {};
const ACADEMIC_DAY_START_HOUR = 7;
const ACADEMIC_DAY_END_HOUR = 20;

const defaultEventPropGetter = (event) => ({
  style: {
    backgroundColor: event.color || "#0a7c88",
    color: "#000",
    borderColor: event.color || "#0a7c88",
  },
});

export default function StandardCalendar({
  events = [],
  date,
  view,
  onNavigate,
  onView,
  onDrillDown,
  onSelectSlot,
  onSelectEvent,
  eventPropGetter = defaultEventPropGetter,
  // Optional overrides. Defaults reproduce the academic-calendar behaviour exactly, so
  // existing callers (class schedule / CalendarEvents) are unaffected.
  dayStartHour = ACADEMIC_DAY_START_HOUR,
  dayEndHour = ACADEMIC_DAY_END_HOUR,
  showAllEvents = true,
  eventComponent = null,
  wrapperClassName = "",
  onShowMore, // undefined keeps react-big-calendar's default "+N more" popup
}) {
  const startHour = Number.isFinite(dayStartHour) ? dayStartHour : ACADEMIC_DAY_START_HOUR;
  const endHour = Number.isFinite(dayEndHour) ? dayEndHour : ACADEMIC_DAY_END_HOUR;

  // react-big-calendar's `min`/`max` clip the Day/Week time grid to this window — anything
  // scheduled outside it (an early-morning or evening class) doesn't just scroll off-screen,
  // it's not rendered at all, with no error or indication anything is missing. The 7am-8pm
  // default covers the common case, but a real class scheduled at, say, 8:30pm would silently
  // vanish from Day/Week view (Month view is unaffected — it isn't an hour grid). Widen the
  // window to cover whatever events actually fall within the visible range — the single `date`
  // for Day view, but the WHOLE rendered week for Week view (react-big-calendar renders all 7
  // days of the week regardless of which one `date` happens to point at, so scanning only
  // `date` itself would still clip an evening class on a different day of that same week).
  const eventHourBounds = useMemo(() => {
    if (view === "month") return null;
    const rangeStart = view === "week" ? moment(date ?? new Date()).startOf("week") : moment(date ?? new Date()).startOf("day");
    const rangeEnd = view === "week" ? moment(date ?? new Date()).endOf("week") : moment(date ?? new Date()).endOf("day");
    let minHour = null;
    let maxHour = null;
    (events || []).forEach((event) => {
      const start = event?.start;
      const end = event?.end;
      if (start instanceof Date && !isNaN(start.getTime()) && moment(start).isBetween(rangeStart, rangeEnd, null, "[]")) {
        const h = start.getHours() + start.getMinutes() / 60;
        if (minHour == null || h < minHour) minHour = h;
      }
      if (end instanceof Date && !isNaN(end.getTime()) && moment(end).isBetween(rangeStart, rangeEnd, null, "[]")) {
        const h = end.getHours() + (end.getMinutes() > 0 ? 1 : 0);
        if (maxHour == null || h > maxHour) maxHour = h;
      }
    });
    return { minHour, maxHour };
  }, [events, date, view]);

  const effectiveStartHour = Math.min(startHour, eventHourBounds?.minHour ?? startHour);
  const effectiveEndHour = Math.max(endHour, eventHourBounds?.maxHour ?? endHour);

  const visibleStart = useMemo(() => {
    const base = moment(date ?? new Date()).startOf("day").hour(Math.floor(effectiveStartHour)).minute(0).second(0).millisecond(0);
    return base.toDate();
  }, [date, effectiveStartHour]);

  const visibleEnd = useMemo(() => {
    // hour 24 is not addressable — clamp to 23:59:59.999 so a full-day window really
    // includes 11:59 PM deadlines instead of silently truncating at the top of the hour.
    const base = moment(date ?? new Date()).startOf("day");
    if (effectiveEndHour >= 24) return base.hour(23).minute(59).second(59).millisecond(999).toDate();
    return base.hour(Math.ceil(effectiveEndHour)).minute(0).second(0).millisecond(0).toDate();
  }, [date, effectiveEndHour]);

  const scrollToTime = useMemo(() => {
    if (view === "month") return visibleStart;
    const validStarts = (events || [])
      .map((event) => event?.start)
      .filter((start) => start instanceof Date && !isNaN(start.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    const first = validStarts[0];
    if (!first) return visibleStart;
    return moment(date ?? first)
      .startOf("day")
      .hour(Math.max(startHour, moment(first).hour() - 1))
      .minute(0)
      .second(0)
      .millisecond(0)
      .toDate();
  }, [date, events, view, visibleStart, startHour]);

  const formats = useMemo(
    () => ({
      dayFormat: (d, culture, loc) => loc.format(d, "D dddd", culture),
      timeGutterFormat: (d, culture, loc) => loc.format(d, "hh:mm a", culture),
    }),
    []
  );

  const EventWithTooltip = useCallback(({ event }) => {
    if (!event) return <span />;
    const startValid = event.start instanceof Date && !isNaN(event.start.getTime());
    const endValid = event.end instanceof Date && !isNaN(event.end.getTime());
    const timeStr = startValid && endValid
      ? `${moment(event.start).format("hh:mm A")} – ${moment(event.end).format("hh:mm A")}`
      : startValid ? moment(event.start).format("hh:mm A") : "";
    const lines = [];

    if (event.scheduleTitle) lines.push(event.scheduleTitle);
    if (event.courseName) lines.push(`Course: ${event.courseName}`);
    if (event.className) lines.push(`Class: ${event.className}`);

    if (event.companyName) lines.push(`Company: ${event.companyName}`);
    if (event.interviewType) lines.push(`Round: ${event.interviewType}`);
    if (event.interviewMode) {
      lines.push(`Mode: ${event.interviewMode === "ONLINE" ? "Online" : event.interviewMode === "OFFLINE" ? "In-Person" : event.interviewMode}`);
    }
    if (event.location) lines.push(`Location: ${event.location}`);
    if (event.interviewStatus) {
      const statusLabel = (event.interviewStatus || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`Status: ${statusLabel}`);
    }
    if (event.roundDescription) {
      const desc = event.roundDescription.length > 120 ? event.roundDescription.substring(0, 120) + "…" : event.roundDescription;
      lines.push(desc);
    }
    if (event.hasOriginalDuration && typeof event.durationMinutes === "number") {
      lines.push(`Duration: ${event.durationMinutes} min`);
    }

    if (timeStr) lines.push(timeStr);

    const tooltipContent = lines.filter(Boolean).join("\n") || event.title;
    return (
      <Tooltip
        title={<span style={{ whiteSpace: "pre-line" }}>{tooltipContent}</span>}
        placement="top"
        mouseEnterDelay={0.3}
      >
        <span>{event.title}</span>
      </Tooltip>
    );
  }, []);

  const components = useMemo(
    () => ({
      timeGutterHeader: function AllDayHeader() {
        return <div className="all-day-text">ALL DAY</div>;
      },
      event: eventComponent || EventWithTooltip,
      week: {
        header: MyWeekHeader,
      },
    }),
    [EventWithTooltip, eventComponent]
  );

  const slotGroupPropGetter = useCallback(
    () => ({
      style: { minHeight: 60 },
    }),
    []
  );

  return (
    <div className={`${styles.calendarWrapper} ${wrapperClassName}`.trim()} role="region" aria-label="Calendar">
      <style jsx global>{`
        .calendar-wrapper .rbc-time-header-gutter,
        .calendar-wrapper .rbc-time-gutter {
          width: 90px !important;
          min-width: 90px !important;
          max-width: 90px !important;
          flex: 0 0 90px !important;
        }
        .calendar-wrapper .all-day-text {
          margin-left: 0 !important;
          text-align: center !important;
          width: 100% !important;
        }
        @media only screen and (max-width: 768px) {
          .calendar-wrapper .rbc-time-header-gutter,
          .calendar-wrapper .rbc-time-gutter {
            width: 70px !important;
            min-width: 70px !important;
            max-width: 70px !important;
            flex: 0 0 70px !important;
          }
        }
        @media only screen and (max-width: 480px) {
          .calendar-wrapper .rbc-time-header-gutter,
          .calendar-wrapper .rbc-time-gutter {
            width: 55px !important;
            min-width: 55px !important;
            max-width: 55px !important;
            flex: 0 0 55px !important;
          }
        }
      `}</style>
      <Calendar
        showAllEvents={showAllEvents}
        views={["day", "week", "month"]}
        toolbar={false}
        localizer={localizer}
        events={events}
        style={{ height: "var(--cal-height, calc(100vh - 200px))", minHeight: 400, flex: 1 }}
        onSelectEvent={onSelectEvent || NOOP}
        components={components}
        formats={formats}
        date={date ?? new Date()}
        view={view ?? "week"}
        min={visibleStart}
        max={visibleEnd}
        scrollToTime={scrollToTime}
        onDrillDown={onDrillDown}
        selectable
        longPressThreshold={180}
        onSelectSlot={onSelectSlot || ((slotInfo) => {
          const selected = Array.isArray(slotInfo?.slots) && slotInfo.slots.length > 0
            ? slotInfo.slots[0]
            : slotInfo?.start;
          if (selected && onDrillDown) onDrillDown(selected);
        })}
        onShowMore={onShowMore}
        onNavigate={onNavigate}
        onView={onView}
        eventPropGetter={eventPropGetter}
        slotGroupPropGetter={slotGroupPropGetter}
      />
    </div>
  );
}
