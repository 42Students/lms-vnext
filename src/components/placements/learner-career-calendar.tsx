"use client";

import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {readLearnerCalendarUrl,learnerCalendarHref,type LearnerCalendarUrlState} from "@/modules/placements/learner-career-calendar-url-model";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Drawer } from "@/components/ui/drawer";
import { findOwnCareerCalendarEvent,learnerCareerCalendarEventTarget }
  from "@/modules/placements/learner-career-event-detail-model";
import { parseLearnerCareerDate } from "@/modules/placements/learner-career-date-model";
import { learnerMobileCareerAgenda } from "@/modules/placements/learner-mobile-career-agenda-model";
import { learnerCareerDayChips } from "@/modules/placements/learner-career-day-chips-model";
import { learnerCareerKindCounts } from "@/modules/placements/learner-career-kind-count-model";
import { learnerCareerWeekDays } from "@/modules/placements/learner-career-week-days-model";
import { learnerCareerDayTimeline } from "@/modules/placements/learner-career-day-timeline-model";
import { learnerCareerNavigationDate } from "@/modules/placements/learner-career-navigation-model";
import { learnerCareerSelectedPeriodIcal } from "@/modules/placements/learner-career-period-export-model";
import {
  initialCareerCalendarDay,
  careerCalendarEvents,
  careerCalendarPeriod,
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
  todayAnchor=initialAnchor,
  surface="calendar",
}: {
  rounds: readonly CareerCalendarSourceRound[];
  initialAnchor: string;
  todayAnchor?:string;
  surface?: "calendar" | "schedule";
}) {
  const params=useSearchParams();
  const state=readLearnerCalendarUrl(params.toString(),todayAnchor);
  const {date:anchor,view,kind:filter}=state;
  const previousDate=learnerCareerNavigationDate(anchor,view,-1);
  const nextDate=learnerCareerNavigationDate(anchor,view,1);
  function changeCalendar(patch:Partial<LearnerCalendarUrlState>){
    window.history.pushState(null,"",learnerCalendarHref({...state,...patch},surface));
    setSelectedKey(null);
  }
  const [selectedKey,setSelectedKey]=useState<string|null>(null);

  const events = careerCalendarEvents(rounds);
  const filtered = filter === "ALL"
    ? events
    : events.filter((event) => event.kind === filter);
  const period = careerCalendarPeriod(filtered, anchor, view);
  const monthCounts = learnerCareerKindCounts(period.events);
  const dayTimeline = view === "day" ? learnerCareerDayTimeline(period.events, anchor) : null;

  const calendarDays = (() => {
    if (view !== "month" && view !== "week") return [];
    const first = view === "month" ? anchor.slice(0, 7) + "-01" : period.start;
    const offset = view === "month"
      ? (new Date(first + "T12:00:00Z").getUTCDay() + 6) % 7
      : 0;
    const start = shiftCareerCalendarDay(first, "day", -offset);
    return Array.from({ length: view === "month" ? 42 : 7 }, (_, index) =>
      shiftCareerCalendarDay(start, "day", index));
  })();

  const byDay = (() => {
    const map = new Map<string, CareerCalendarEvent[]>();
    for (const event of filtered) {
      const bucket = map.get(event.dayKey) ?? [];
      bucket.push(event);
      map.set(event.dayKey, bucket);
    }
    return map;
  })();

  const selected=findOwnCareerCalendarEvent(filtered,selectedKey);
  function showEventDetail(event:CareerCalendarEvent){setSelectedKey(event.key);}

  const mobileDays=view==="week"
    ? learnerCareerWeekDays(period.start,period.events)
    : learnerMobileCareerAgenda(period.events);

  function downloadCalendar() {
    const file = learnerCareerSelectedPeriodIcal(filtered,anchor,view,new Date()).ical;
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
      <section className="border-b border-border pb-5">
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
            disabled={period.events.length === 0}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-primary bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
          >
            Export selected period .ics
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Calendar view">
          {views.map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={view === option}
              onClick={() => changeCalendar({view:option})}
              className={view === option
                ? "min-h-11 rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-3 text-sm font-[650] capitalize text-[var(--lms-on-primary)] sm:min-h-9"
                : "min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-[14px] font-semibold capitalize text-body sm:min-h-9 hover:text-primary-text"}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-label="Previous calendar period"
            onClick={() => {if(previousDate)changeCalendar({date:previousDate});}}
            disabled={previousDate===null}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body disabled:cursor-not-allowed disabled:opacity-50"
          >←</button>
          <button
            type="button"
            onClick={() => changeCalendar({date:initialCareerCalendarDay()})}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body"
          >Today</button>
          <button
            type="button"
            aria-label="Next calendar period"
            onClick={() => {if(nextDate)changeCalendar({date:nextDate});}}
            disabled={nextDate===null}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body disabled:cursor-not-allowed disabled:opacity-50"
          >→</button>
          <span className="text-sm font-semibold text-foreground">
            {view === "day" ? prettyDay(anchor) : `${prettyDay(period.start)} – ${prettyDay(period.end)}`}
          </span>
        </div>
        <label className="mt-3 block max-w-xs text-xs font-semibold text-body">
          Jump to date (IST)
          <input type="date" aria-label="Choose career calendar date"
            min="2000-01-01" max="2100-12-31" value={anchor}
            onChange={(event)=>{
              const day=parseLearnerCareerDate(event.target.value);
              if(day)changeCalendar({date:day});
            }}
            className="mt-1 min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground"/>
        </label>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter career events">
          {filters.map((option) => (
            <button
              type="button"
              key={option.key}
              aria-pressed={filter === option.key}
              onClick={() => changeCalendar({kind:option.key})}
              className={filter === option.key
                ? "min-h-11 rounded-full bg-primary-subtle px-3 text-xs font-bold text-primary-text ring-1 ring-primary"
                : "min-h-11 rounded-full border border-border px-3 text-xs font-semibold text-body"}
            >{option.label}</button>
          ))}
        </div>
      </section>

      {view === "month" ? (
        <section className="flex flex-wrap gap-3 border-b border-border pb-4 text-sm text-body" aria-label="Selected month round totals">
          <strong className="text-foreground">{new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(period.start+"T12:00:00Z"))}: {monthCounts.total} scheduled round{monthCounts.total===1?"":"s"}</strong>
          <span>{monthCounts.assessments} assessments</span>
          <span>{monthCounts.interviews} interviews</span>
          <span>{monthCounts.other} other</span>
        </section>
      ) : null}

      {calendarDays.length ? (
        <section className="hidden overflow-x-auto rounded-xl border border-border bg-surface p-3 md:block" aria-label={view + " calendar grid"}>
          <div className="grid min-w-[38rem] grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <p key={label} className="py-2 text-center text-xs font-semibold uppercase text-muted-foreground">
                {label}
              </p>
            ))}
            {calendarDays.map((day) => {
              const dayEvents = byDay.get(day) ?? [];
              const chips = learnerCareerDayChips(dayEvents);
              const outside = view === "month" && day.slice(0, 7) !== anchor.slice(0, 7);
              return (
                <button
                  type="button"
                  key={day}
                  aria-label={`${prettyDay(day)}: ${dayEvents.length} events`}
                  onClick={() => { changeCalendar({date:day,view:"day"}); }}
                  className={`min-h-24 rounded-[var(--lms-control-radius)] border border-border p-2 text-left transition hover:border-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)] ${outside ? "opacity-50" : ""}`}
                >
                  <span className="block text-xs font-semibold text-foreground">{day.slice(-2)}</span>
                  <span className="mt-2 block text-xs text-body">
                    {dayEvents.length ? `${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : "—"}
                  </span>
                  {chips.visible.map((chip) => (
                    <span key={chip.key} className="mt-1 block max-w-full truncate rounded bg-primary-subtle px-1.5 py-0.5 text-xs font-semibold text-primary-text"
                      title={chip.title + " · " + chip.kind}>
                      {chip.kind === "ASSESSMENT" ? "Assessment" : chip.kind === "INTERVIEW" ? "Interview" : "Other"} · {chip.title}
                    </span>
                  ))}
                  {chips.hidden > 0 ? <span className="mt-1 block text-xs text-body">+{chips.hidden} more</span> : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {dayTimeline ? (
        <section className="rounded-xl border border-border bg-surface p-4" aria-label="Selected day schedule summary">
          <h3 className="m-0 text-base font-semibold text-foreground">{prettyDay(anchor)} · Day schedule</h3>
          <p role="status" className="mt-2 text-sm text-body">
            {dayTimeline.events.length} scheduled round{dayTimeline.events.length===1?"":"s"} on this IST date.
            {dayTimeline.first ? " First: " + displayDate(dayTimeline.first.start) + "." : ""}
            {dayTimeline.last && dayTimeline.events.length>1 ? " Last: " + displayDate(dayTimeline.last.start) + "." : ""}
          </p>
        </section>
      ) : null}

      {calendarDays.length ? (
        <section className="space-y-4 md:hidden" aria-label="Mobile career calendar agenda">
          <h3 className="text-base font-semibold text-foreground">Agenda by day (IST)</h3>
          {mobileDays.length===0 ? (
            <p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
              No scheduled placement events match this period and filter.
            </p>
          ) : mobileDays.map(day=>(
            <div key={day.dayKey} className="rounded-xl border border-border bg-surface p-4">
              <h4 className="text-sm font-semibold text-foreground">{prettyDay(day.dayKey)}</h4>
              {day.events.length===0?<p className="mt-2 text-sm text-body">No scheduled rounds on this day.</p>:null}
              <ul className="mt-3 divide-y divide-border">
                {day.events.map(event=>(
                  <li key={event.key} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-semibold text-foreground">{event.title} · {event.companyName}</p>
                    <p className="mt-1 text-xs text-body">{displayDate(event.start)} · {event.kind}</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <button type="button" onClick={()=>showEventDetail(event)}
                        className="min-h-11 text-sm font-semibold text-primary-text">
                        Event details
                      </button>
                      <Link href={learnerCareerCalendarEventTarget(event)}
                        className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text">
                        Open exact round →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      <section aria-label="Career events in selected period" className={calendarDays.length ? "hidden space-y-3 md:block" : "space-y-3"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-base font-semibold text-foreground">
            {view === "agenda" ? "30-day agenda" : view === "day" ? "Day events" : "Events"} · {period.events.length}
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
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={()=>showEventDetail(event)}
                className="min-h-11 text-sm font-semibold text-primary-text hover:underline">
                Event details
              </button>
              <Link href={hrefForEvent(event)}
                className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline">
                View application →
              </Link>
            </div>
          </article>
        ))}
      </section>
      <Drawer open={selected!==null} onOpenChange={(open)=>{if(!open)setSelectedKey(null);}}
        title={selected?.title??"Career event"}
        description={selected?selected.companyName+" · "+selected.roleTitle:undefined}
        footer={
          <>
            {selected?<Link href={learnerCareerCalendarEventTarget(selected)}
              className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
              Open exact round
            </Link>:null}
            <button type="button" onClick={()=>setSelectedKey(null)}
              className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body">
              Close
            </button>
          </>
        }>
        {selected?<dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-muted-foreground">Scheduled (IST)</dt>
            <dd className="mt-1 text-foreground">{displayDate(selected.start)}</dd></div>
          <div><dt className="font-semibold text-muted-foreground">Round type</dt>
            <dd className="mt-1 text-foreground">{selected.kind}</dd></div>
          <div><dt className="font-semibold text-muted-foreground">Employer</dt>
            <dd className="mt-1 text-foreground">{selected.companyName}</dd></div>
          <div><dt className="font-semibold text-muted-foreground">Role</dt>
            <dd className="mt-1 text-foreground">{selected.roleTitle}</dd></div>
          {selected.rescheduled?<p role="status" className="sm:col-span-2 text-body">
            Approved reschedule applied to this event.
          </p>:null}
        </dl>:null}
      </Drawer>
    </div>
  );
}
