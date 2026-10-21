import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import moment from "moment";
import { Button, Empty } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import MiniCalendar from "./MiniCalendar";
import styles from "./CalendarMobileList.module.scss";

const LEARN_MOBILE_BP = 767;
const RESIZE_DEBOUNCE_MS = 150;
const FALLBACK_COLOR = "#5B8DEE";

/**
 * Returns true if we're in the mobile breakpoint (for SSR-safe initial render).
 */
function isCalendarMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= LEARN_MOBILE_BP;
}

/** When on mobile, sync parent view to "month" once so API fetches full month. */
function useMobileMonthView(isMobile, onView) {
  const synced = useRef(false);
  const onViewRef = useRef(onView);
  onViewRef.current = onView;
  useEffect(() => {
    if (isMobile && onViewRef.current && !synced.current) {
      synced.current = true;
      onViewRef.current("month");
    }
    if (!isMobile) synced.current = false;
  }, [isMobile]);
}

/**
 * Groups events by day (local date key YYYY-MM-DD) and sorts events within each day.
 */
function groupEventsByDay(events) {
  const byDay = {};
  (events || []).forEach((ev) => {
    const start = ev.start instanceof Date ? ev.start : new Date(ev.start);
    if (isNaN(start.getTime())) return;
    const key = moment(start).format("YYYY-MM-DD");
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push({ ...ev, start });
  });
  Object.keys(byDay).forEach((k) => {
    byDay[k].sort((a, b) => (a.start.getTime() || 0) - (b.start.getTime() || 0));
  });
  return byDay;
}

/**
 * Returns array of day keys in range, sorted.
 */
function getDayKeysInRange(view, date) {
  const m = moment(date);
  if (!m.isValid()) return [];
  let start;
  let end;
  if (view === "day") {
    start = m.clone().startOf("day");
    end = m.clone().endOf("day");
  } else if (view === "week") {
    start = m.clone().startOf("week");
    end = m.clone().endOf("week");
  } else {
    start = m.clone().startOf("month");
    end = m.clone().endOf("month");
  }
  const keys = [];
  const cur = start.clone();
  while (cur.isSameOrBefore(end, "day")) {
    keys.push(cur.format("YYYY-MM-DD"));
    cur.add(1, "day");
  }
  return keys;
}

function formatTime(date) {
  return moment(date).format("h:mm A");
}

function formatDayLabel(dayKey) {
  const m = moment(dayKey);
  const today = moment().format("YYYY-MM-DD");
  const tomorrow = moment().add(1, "day").format("YYYY-MM-DD");
  if (dayKey === today) return "Today";
  if (dayKey === tomorrow) return "Tomorrow";
  return m.format("ddd, MMM D");
}

export default function CalendarMobileList({
  events = [],
  date,
  view = "week",
  onNavigate,
  onView,
  onSelectEvent,
  eventPropGetter,
  loading = false,
  emptyMessage = "No events in this period.",
  emptyComponent,
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    let timer;
    const check = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIsMobile(window.innerWidth <= LEARN_MOBILE_BP), RESIZE_DEBOUNCE_MS);
    };
    // Initial check without debounce
    setIsMobile(window.innerWidth <= LEARN_MOBILE_BP);
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", check);
    };
  }, []);
  useMobileMonthView(isMobile, onView);

  const effectiveView = isMobile ? "month" : view;
  const dayKeys = useMemo(() => getDayKeysInRange(effectiveView, date), [effectiveView, date]);
  const byDay = useMemo(
    () => groupEventsByDay(events),
    [events]
  );

  const goPrev = () => {
    const unit = effectiveView === "month" ? "months" : effectiveView === "day" ? "days" : "weeks";
    onNavigate(moment(date).subtract(1, unit).toDate());
  };
  const goNext = () => {
    const unit = effectiveView === "month" ? "months" : effectiveView === "day" ? "days" : "weeks";
    onNavigate(moment(date).add(1, unit).toDate());
  };
  const totalEvents = dayKeys.reduce((sum, k) => sum + (byDay[k]?.length || 0), 0);

  const [scrollToDayKey, setScrollToDayKey] = useState(null);
  useEffect(() => {
    if (!scrollToDayKey) return;
    const el = document.getElementById(`calendar-day-${scrollToDayKey}`);
    if (el) {
      requestAnimationFrame(() => {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch {
          el.scrollIntoView(true);
        }
      });
    }
    setScrollToDayKey(null);
  }, [scrollToDayKey]);

  const handleSelectDay = useCallback((day) => {
    const parsed = day instanceof Date ? day : new Date(day);
    if (isNaN(parsed.getTime())) return;
    const dayKey = moment(parsed).format("YYYY-MM-DD");
    onNavigate(parsed);
    setScrollToDayKey(dayKey);
  }, [onNavigate]);
  const handlePrevMonth = () => onNavigate(moment(date).subtract(1, "month").toDate());
  const handleNextMonth = () => onNavigate(moment(date).add(1, "month").toDate());

  return (
    <div
      className={`${styles.wrapper} learn-calendar-mobile-list`}
      aria-busy={loading || undefined}
    >
      <MiniCalendar
        date={date}
        events={events}
        onSelectDay={handleSelectDay}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />
      <div className={styles.toolbar}>
        <div className={styles.navRow}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goPrev}
            aria-label="Previous period"
          >
            <LeftOutlined />
          </button>
          <span className={styles.monthLabel}>{moment(date).format("MMMM YYYY")}</span>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goNext}
            aria-label="Next period"
          >
            <RightOutlined />
          </button>
        </div>
        <div className={styles.actions}>
          <Button
            type="default"
            size="small"
            className={styles.todayBtn}
            onClick={() => onNavigate(new Date())}
            aria-label="Go to today"
          >
            Today
          </Button>
          {/* A view <Select> used to live here behind `!isMobile`, but this list only ever
              renders inside a mobile-only container — the control could never appear. */}
        </div>
      </div>

      <div className={styles.list}>
        {loading && events.length === 0 ? (
          <div className={styles.empty} role="status" aria-live="polite">
            <Empty description="Loading…" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : totalEvents === 0 ? (
          <div className={styles.empty}>
            {emptyComponent || (
              <Empty description={emptyMessage} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        ) : (
          dayKeys.map((dayKey) => {
            const dayEvents = byDay[dayKey] || [];
            if (effectiveView === "month" && dayEvents.length === 0) return null;
            return (
              <div key={dayKey} id={`calendar-day-${dayKey}`} className={styles.dayBlock}>
                <div className={styles.dayHeader}>{formatDayLabel(dayKey)}</div>
                <div className={styles.dayEvents}>
                  {dayEvents.map((event, idx) => {
                    const style = eventPropGetter ? eventPropGetter(event)?.style : {};
                    const baseColor = style?.borderColor || event.color || FALLBACK_COLOR;
                    const textColor = style?.color || event.textColor || "#1a1d21";
                    const eventLabel = [event.title, event.courseName].filter(Boolean).join(" — ");
                    return (
                      <button
                        key={event.id || `${dayKey}-${idx}`}
                        type="button"
                        className={styles.eventCard}
                        onClick={() => onSelectEvent?.(event)}
                        aria-label={eventLabel || "Scheduled event"}
                        style={{
                          borderLeftColor: baseColor,
                          backgroundColor: `${baseColor}18`,
                          color: textColor === "#fff" ? "#1a1d21" : textColor,
                        }}
                      >
                        <div className={styles.eventTime}>
                          {formatTime(event.start)}
                          {event.end && ` – ${formatTime(event.end)}`}
                        </div>
                        <div className={styles.eventTitle}>{event.title}</div>
                        {(event.courseName || event.companyName) && (
                          <div className={styles.eventSub}>
                            {event.courseName || event.companyName}
                            {event.interviewType && ` · ${event.interviewType}`}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
