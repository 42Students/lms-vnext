"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  careerCalendarEvents,
  careerCalendarPeriod,
  learnerCareerIcal,
  shiftCareerCalendarDay,
  type CareerCalendarEvent,
  type CareerCalendarSourceRound,
  type CareerCalendarView,
} from "@/modules/placements/learner-career-calendar-model";

const views: CareerCalendarView[] = ["agenda", "month", "week", "day"];
type EventFilter = "ALL" | CareerCalendarEvent["kind"];
const filters: { key: EventFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ASSESSMENT", label: "Assessments" },
  { key: "INTERVIEW", label: "Interviews" },
  { key: "OTHER", label: "Other" },
];

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function prettyDay(dayKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeZone: "UTC",
  }).format(new Date(dayKey + "T12:00:00.000Z"));
}

function hrefForEvent(event: CareerCalendarEvent) {
  return "/learn/my-placements/applications?applicationId=" +
    encodeURIComponent(event.applicationId);
}

export function LearnerCareerCalendar({
  rounds,
  initialAnchor,
}: {
  rounds: readonly CareerCalendarSourceRound[];
  initialAnchor: string;
}) {
  const [anchor, setAnchor] = useState(initialAnchor);
  const [view, setView] = useState<CareerCalendarView>("agenda");
  const [filter, setFilter] = useState<EventFilter>("ALL");

  const events = useMemo(() => careerCalendarEvents(rounds), [rounds]);
  const filtered = useMemo(() => filter === "ALL"
    ? events
    : events.filter((event) => event.kind === filter), [events, filter]);
  const period = useMemo(
    () => careerCalendarPeriod(filtered, anchor, view),
    [filtered, anchor, view],
  );

  const calendarDays = useMemo(() => {
    if (view !== "month" && view !== "week") return [];
    const first = view === "month" ? anchor.slice(0, 7) + "-01" : period.start;
    const offset = view === "month"
      ? (new Date(first + "T12:00:00Z").getUTCDay() + 6) % 7
      : 0;
    const start = shiftCareerCalendarDay(first, "day", -offset);
    return Array.from({ length: view === "month" ? 42 : 7 }, (_, index) =>
      shiftCareerCalendarDay(start, "day", index));
  }, [anchor, period.start, view]);

  const byDay = useMemo(() => {
    const map = new Map<string, CareerCalendarEvent[]>();
    for (const event of filtered) {
      const bucket = map.get(event.dayKey) ?? [];
      bucket.push(event);
      map.set(event.dayKey, bucket);
    }
    return map;
  }, [filtered]);

  function downloadCalendar() {
    const file = learnerCareerIcal(filtered, new Date());
    const url = URL.createObjectURL(new Blob([file], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-career-calendar.ics";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="space-y-5" aria-label="Learner Career Calendar">
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="m-0 text-base font-semibold text-foreground">Career calendar</h2>
            <p className="mt-2 text-sm text-body">
              Scheduled employer assessments, interviews and other rounds for your applications.
              Approved reschedules replace the original slot.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadCalendar}
            disabled={filtered.length === 0}
            className="min-h-11 rounded-md border border-primary bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
          >
            Export .ics
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Calendar view">
          {views.map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={view === option
                ? "min-h-10 rounded-md bg-primary px-3 text-sm font-semibold capitalize text-on-primary"
                : "min-h-10 rounded-md border border-border bg-surface px-3 text-sm font-semibold capitalize text-body hover:text-primary-text"}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-label="Previous calendar period"
            onClick={() => setAnchor((current) => shiftCareerCalendarDay(current, view, -1))}
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-body"
          >←</button>
          <button
            type="button"
            onClick={() => setAnchor(initialAnchor)}
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-body"
          >Today</button>
          <button
            type="button"
            aria-label="Next calendar period"
            onClick={() => setAnchor((current) => shiftCareerCalendarDay(current, view, 1))}
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-body"
          >→</button>
          <span className="text-sm font-semibold text-foreground">
            {view === "day" ? prettyDay(anchor) : `${prettyDay(period.start)} – ${prettyDay(period.end)}`}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter career events">
          {filters.map((option) => (
            <button
              type="button"
              key={option.key}
              aria-pressed={filter === option.key}
              onClick={() => setFilter(option.key)}
              className={filter === option.key
                ? "min-h-10 rounded-full bg-primary-subtle px-3 text-xs font-bold text-primary-text ring-1 ring-primary"
                : "min-h-10 rounded-full border border-border px-3 text-xs font-semibold text-body"}
            >{option.label}</button>
          ))}
        </div>
      </section>

      {calendarDays.length ? (
        <section className="overflow-x-auto rounded-xl border border-border bg-surface p-3" aria-label={view + " calendar grid"}>
          <div className="grid min-w-[38rem] grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <p key={label} className="py-2 text-center text-xs font-semibold uppercase text-muted-foreground">
                {label}
              </p>
            ))}
            {calendarDays.map((day) => {
              const dayEvents = byDay.get(day) ?? [];
              const outside = view === "month" && day.slice(0, 7) !== anchor.slice(0, 7);
              return (
                <button
                  type="button"
                  key={day}
                  aria-label={`${prettyDay(day)}: ${dayEvents.length} events`}
                  onClick={() => { setAnchor(day); setView("day"); }}
                  className={`min-h-24 rounded-md border border-border p-2 text-left transition hover:border-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)] ${outside ? "opacity-50" : ""}`}
                >
                  <span className="block text-xs font-semibold text-foreground">{day.slice(-2)}</span>
                  <span className="mt-2 block text-xs text-body">
                    {dayEvents.length ? `${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : "—"}
                  </span>
                  {dayEvents.some((item) => item.kind === "ASSESSMENT") ? (
                    <span className="mt-1 block text-xs font-semibold text-primary-text">Assessment</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section aria-label="Career events in selected period" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-base font-semibold text-foreground">
            {view === "agenda" ? "Agenda" : "Events"} · {period.events.length}
          </h3>
          <span className="text-xs text-muted-foreground">
            Times shown in Indian Standard Time
          </span>
        </div>
        {period.events.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
            {events.length === 0
              ? "No career events have been scheduled for you yet."
              : "No events match these filters in the selected period. Choose another date or filter."}
          </div>
        ) : period.events.map((event) => (
          <article
            key={event.key}
            className="rounded-xl border border-border bg-surface p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-bold uppercase text-primary-text">{event.companyName}</p>
                <h4 className="mt-1 text-base font-semibold text-foreground">{event.title}</h4>
                <p className="mt-1 text-sm text-body">{event.roleTitle} · {displayDate(event.start)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={event.kind === "ASSESSMENT" ? "warning" : "info"}>
                  {event.kind === "ASSESSMENT" ? "Assessment" : event.kind === "INTERVIEW" ? "Interview" : "Other round"}
                </StatusBadge>
                {event.rescheduled ? <StatusBadge>Rescheduled</StatusBadge> : null}
              </div>
            </div>
            <Link
              href={hrefForEvent(event)}
              className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline"
            >View application →</Link>
          </article>
        ))}
      </section>
    </div>
  );
}
