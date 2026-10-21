import React, { useMemo } from "react";
import moment from "moment";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styles from "./CalendarMobileList.module.scss";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Returns Set of "YYYY-MM-DD" keys for days that have at least one event.
 */
function getDaysWithEvents(events) {
  const set = new Set();
  (events || []).forEach((ev) => {
    const start = ev.start instanceof Date ? ev.start : new Date(ev.start);
    set.add(moment(start).format("YYYY-MM-DD"));
  });
  return set;
}

/**
 * Build calendar grid for one month: array of weeks, each week is array of 7 days (null for padding).
 * First week may start with nulls for days before month start.
 */
function getMonthGrid(date) {
  const m = moment(date);
  if (!m.isValid()) return [];
  m.startOf("month");
  const startWeekday = m.day();
  const daysInMonth = m.daysInMonth();
  const grid = [];
  let week = [];
  for (let i = 0; i < startWeekday; i++) week.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(moment(date).date(d).toDate());
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    grid.push(week);
  }
  return grid;
}

export default function MiniCalendar({
  date,
  events = [],
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}) {
  const monthGrid = useMemo(() => getMonthGrid(date), [date]);
  const daysWithEvents = useMemo(() => getDaysWithEvents(events), [events]);
  const todayKey = moment().format("YYYY-MM-DD");
  const currentMonth = moment(date).format("YYYY-MM");
  const selectedKey = moment(date).format("YYYY-MM-DD");

  return (
    <div className={styles.miniCal}>
      <div className={styles.miniCalHeader}>
        <button
          type="button"
          className={styles.miniCalNav}
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <LeftOutlined aria-hidden />
        </button>
        <span className={styles.miniCalMonth}>{moment(date).format("MMMM YYYY")}</span>
        <button
          type="button"
          className={styles.miniCalNav}
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <RightOutlined aria-hidden />
        </button>
      </div>
      <div className={styles.miniCalWeekdays}>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className={styles.miniCalWeekday}>
            {label}
          </div>
        ))}
      </div>
      <div className={styles.miniCalGrid}>
        {monthGrid.map((week, wi) =>
          week.map((day, di) => {
            if (!day) {
              return <div key={`${wi}-${di}-empty`} className={styles.miniCalDayEmpty} />;
            }
            const dayKey = moment(day).format("YYYY-MM-DD");
            const isToday = dayKey === todayKey;
            const isSelected = dayKey === selectedKey;
            const hasEvents = daysWithEvents.has(dayKey);
            const isCurrentMonth = moment(day).format("YYYY-MM") === currentMonth;
            return (
              <button
                key={dayKey}
                type="button"
                className={`${styles.miniCalDay} ${isToday ? styles.miniCalDayToday : ""} ${isSelected ? styles.miniCalDaySelected : ""} ${!isCurrentMonth ? styles.miniCalDayOther : ""}`}
                onClick={() => isCurrentMonth && onSelectDay(day)}
                aria-label={moment(day).format("dddd, MMMM D")}
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                aria-disabled={!isCurrentMonth || undefined}
                tabIndex={isCurrentMonth ? 0 : -1}
              >
                <span className={styles.miniCalDayNum}>{moment(day).format("D")}</span>
                {hasEvents && <span className={styles.miniCalDot} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
