"use client";
import { Input } from "@/components/ui/input";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import calendarStyles from "./legacy-calendar-theme.module.css";
import styles from "./learner-career-calendar.module.css";

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
import {Button} from "@/components/ui/button";
import {FilterChip} from "@/components/ui/filter-chip";

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
    setSelectedDayKey(null);
  }
  const [selectedKey,setSelectedKey]=useState<string|null>(null);
  const [selectedDayKey,setSelectedDayKey]=useState<string|null>(null);

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
  const selectedDayEvents=selectedDayKey
    ? events.filter((event)=>event.dayKey===selectedDayKey) : [];
  const dayDrawerTitle=selectedDayKey
    ? new Intl.DateTimeFormat("en-IN",{
        timeZone:"UTC",weekday:"long",day:"numeric",month:"long",
      }).format(new Date(selectedDayKey+"T12:00:00.000Z")).replace(",", "")
    : "Day schedule";
  function showEventDetail(event:CareerCalendarEvent){
    setSelectedDayKey(null);
    setSelectedKey(event.key);
  }

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
    <div className="min-w-0 space-y-5" aria-label="Learner Career Calendar">
      <section className={styles.toolbar}>
        <div className={styles.header}>
          <div className="min-w-0">
            <h2 className={styles.heading}>Career calendar</h2>
            <p className="mt-2 text-sm text-body">
              Scheduled employer assessments, interviews and other rounds for your applications.
              Approved reschedules replace the original slot.
            </p>
          </div>
          <Button className="min-h-11 w-full shrink-0 sm:w-auto md:min-h-9"
            type="button"
            onClick={downloadCalendar}
            disabled={period.events.length === 0}
            
          >
            Export selected period .ics
          </Button>
        </div>
        <div className={styles.views} role="group" aria-label="Calendar view">
          {views.map((option) => (
            <Button type="button"
              key={option}
              aria-pressed={view === option}
              onClick={() => changeCalendar({view:option})}
              variant={view===option?"primary":"secondary"}
              className="min-h-11 capitalize min-[768px]:min-h-9"
            >
              {option}
            </Button>
          ))}
        </div>
        <div className={styles.nav}>
          <Button variant="ghost" className={styles.navArrow}
            type="button"
            aria-label="Previous calendar period"
            onClick={() => {if(previousDate)changeCalendar({date:previousDate});}}
            disabled={previousDate===null}
            
          >←</Button>
          <Button variant="secondary" className={styles.today}
            type="button"
            onClick={() => changeCalendar({date:initialCareerCalendarDay()})}
            
          >Today</Button>
          <Button variant="ghost" className={styles.navArrow}
            type="button"
            aria-label="Next calendar period"
            onClick={() => {if(nextDate)changeCalendar({date:nextDate});}}
            disabled={nextDate===null}
            
          >→</Button>
          <span className={styles.period}>
            {view === "day" ? prettyDay(anchor) : `${prettyDay(period.start)} – ${prettyDay(period.end)}`}
          </span>
        </div>
        <label className="mt-3 block min-w-0 w-full max-w-xs text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Jump to date (IST)
          <Input type="date" aria-label="Choose career calendar date"
            min="2000-01-01" max="2100-12-31" value={anchor}
            onChange={(event)=>{
              const day=parseLearnerCareerDate(event.target.value);
              if(day)changeCalendar({date:day});
            }}
            className="mt-1 min-h-[var(--lms-control-height)] max-[767px]:min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground"/>
        </label>
        <div className={styles.legend} role="group" aria-label="Filter career events">
          {filters.map((option) => (
            <FilterChip
              className={styles.legendChip}
              data-kind={option.key}
              type="button"
              key={option.key}
              aria-pressed={filter === option.key}
              onClick={() => changeCalendar({kind:option.key})}
            >{option.label}</FilterChip>
          ))}
        </div>
      </section>

      {view === "month" ? (
        <section className="flex flex-wrap gap-3 border-b border-[var(--lms-canvas-border)] pb-4 text-sm text-body" aria-label="Selected month round totals">
          <strong className="text-foreground">{new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(period.start+"T12:00:00Z"))}: {monthCounts.total} scheduled round{monthCounts.total===1?"":"s"}</strong>
          <span>{monthCounts.assessments} assessments</span>
          <span>{monthCounts.interviews} interviews</span>
          <span>{monthCounts.other} other</span>
        </section>
      ) : null}

      {calendarDays.length ? (
        <section className={"hidden p-3 min-[768px]:block "+styles.gridFrame} aria-label={view + " calendar grid"}>
          <CalendarGrid variant="hairline" className={styles.grid}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, index) => (
              <p key={label} className={styles.weekday+" "+(index===6?calendarStyles.calendarSunday:"")}>
                {label}
              </p>
            ))}
            {calendarDays.map((day) => {
              const dayEvents = byDay.get(day) ?? [];
              const chips = learnerCareerDayChips(dayEvents);
              const outside = view === "month" && day.slice(0, 7) !== anchor.slice(0, 7);
              const isSunday = new Date(day+"T12:00:00Z").getUTCDay()===0;
              return (
                <Button variant="ghost"
                  type="button"
                  key={day}
                  aria-label={`${prettyDay(day)}: ${dayEvents.length} events`}
                  aria-current={day===todayAnchor?"date":undefined}
                  onClick={() => { setSelectedKey(null);setSelectedDayKey(day); }}
                  className={[styles.day,day===todayAnchor?styles.todayDay:"",outside?styles.outsideDay:""].filter(Boolean).join(" ")}
                >
                  <span className={styles.dayNumber+" "+(isSunday?calendarStyles.calendarSunday:"")}>{day.slice(-2)}</span>
                  <span className="mt-2 block text-xs text-body">
                    {dayEvents.length ? `${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : "—"}
                  </span>
                  {chips.visible.map((chip) => (
                    <span key={chip.key} data-kind={chip.kind} className={styles.chip}
                      title={chip.title + " · " + chip.kind}>
                      {chip.kind === "ASSESSMENT" ? "Assessment" : chip.kind === "INTERVIEW" ? "Interview" : "Other"} · {chip.title}
                    </span>
                  ))}
                  {chips.hidden > 0 ? <span className={styles.more}>+{chips.hidden} more</span> : null}
                </Button>
              );
            })}
          </CalendarGrid>
        </section>
      ) : null}

      {dayTimeline ? (
        <section className="border-b border-[var(--lms-canvas-border)] py-4" aria-label="Selected day schedule summary">
          <h3 className="m-0 text-[16px] font-semibold leading-[26px] text-foreground min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">{prettyDay(anchor)} · Day schedule</h3>
          <p role="status" className="mt-2 text-sm text-body">
            {dayTimeline.events.length} scheduled round{dayTimeline.events.length===1?"":"s"} on this IST date.
            {dayTimeline.first ? " First: " + displayDate(dayTimeline.first.start) + "." : ""}
            {dayTimeline.last && dayTimeline.events.length>1 ? " Last: " + displayDate(dayTimeline.last.start) + "." : ""}
          </p>
        </section>
      ) : null}

      {calendarDays.length ? (
        <section className={styles.agenda+" md:hidden"} aria-label="Mobile career calendar agenda">
          <h3 className="text-base font-semibold text-foreground">Agenda by day (IST)</h3>
          {mobileDays.length===0 ? (
            <p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
              No scheduled placement events match this period and filter.
            </p>
          ) : mobileDays.map(day=>(
            <div key={day.dayKey} className={styles.mobileDay}>
              <h4 className="text-sm font-semibold text-foreground">
                <Button type="button" variant="link"
                  className="min-h-11 text-sm font-semibold underline md:min-h-9"
                  onClick={()=>{setSelectedKey(null);setSelectedDayKey(day.dayKey);}}>
                  {prettyDay(day.dayKey)} · Day details
                </Button>
              </h4>
              {day.events.length===0?<p className="mt-2 text-sm text-body">No scheduled rounds on this day.</p>:null}
              <ul className={styles.mobileList}>
                {day.events.map(event=>(
                  <li key={event.key} data-kind={event.kind} className={styles.mobileRow}>
                    <p className="text-sm font-semibold text-foreground">{event.title} · {event.companyName}</p>
                    <p className="mt-1 text-xs text-body">{displayDate(event.start)} · {event.kind}</p>
                    <div className="mt-2 flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap">
                      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="ghost" type="button" onClick={()=>showEventDetail(event)}
                        >
                        Event details
                      </Button>
                      <Link href={learnerCareerCalendarEventTarget(event)}
                        className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text sm:w-auto md:min-h-[var(--lms-control-height)] hover:underline focus-visible:underline">
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

      <section aria-label="Career events in selected period" className={calendarDays.length ? "hidden space-y-3 min-[768px]:block" : "space-y-3"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-[16px] font-semibold leading-[26px] text-foreground min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">
            {view === "agenda" ? "30-day agenda" : view === "day" ? "Day events" : "Events"} · {period.events.length}
          </h3>
          <span className="text-xs text-muted-foreground">
            Times shown in Indian Standard Time
          </span>
        </div>
        {period.events.length === 0 ? (
          <div className="flex min-h-[180px] min-w-0 flex-col items-center justify-center gap-3 border-y border-border px-4 py-8 text-center text-sm leading-[1.5] text-body">
            {events.length === 0
              ? "No career events have been scheduled for you yet."
              : "No events match these filters in the selected period. Choose another date or filter."}
            {events.length > 0 ? <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={() => changeCalendar({date:initialCareerCalendarDay(),kind:"ALL"})}>Today</Button> : null}
          </div>
        ) : period.events.map((event) => (
          <article
            key={event.key}
            data-kind={event.kind}
            className={styles.agendaEvent}
          >
            <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
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
              <Button variant="link" className="max-[767px]:min-h-11 text-sm font-[650]" type="button"
                onClick={()=>showEventDetail(event)}>
                Event details
              </Button>
              <Link href={hrefForEvent(event)}
                className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:underline">
                View application →
              </Link>
            </div>
          </article>
        ))}
      </section>
      <Drawer open={selectedDayKey!==null}
        onOpenChange={(open)=>{if(!open)setSelectedDayKey(null);}}
        className="md:!w-[min(440px,100vw)]"
        title={dayDrawerTitle}
        description="Your full scheduled placement day in Indian Standard Time."
        footer={<Button type="button" variant="secondary"
          className="min-h-11 w-full sm:w-auto md:min-h-9"
          onClick={()=>setSelectedDayKey(null)}>Close</Button>}>
        {selectedDayEvents.length === 0
          ? <p role="status" className="text-sm text-body">No scheduled placement rounds on this day.</p>
          : <ol className="space-y-4" aria-label="All rounds on this day">
              {selectedDayEvents.map((event)=>(
                <li key={event.key}
                  className="min-w-0 space-y-2 border-b border-border pb-4 text-sm">
                  <h3 className="font-semibold text-foreground">{event.title}</h3>
                  <p className="text-body">{event.companyName} · {event.roleTitle}</p>
                  <p className="text-body">Scheduled (IST): {displayDate(event.start)}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href={learnerCareerCalendarEventTarget(event)}
                      className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
                      Open exact round
                    </Link>
                    <Link href="/learn/my-placements/schedule?view=coming"
                      className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
                      Check attendance or request reschedule
                    </Link>
                  </div>
                </li>
              ))}
            </ol>}
      </Drawer>
      <Drawer open={selected!==null} onOpenChange={(open)=>{if(!open)setSelectedKey(null);}}
        title={selected?.title??"Career event"}
        description={selected?selected.companyName+" · "+selected.roleTitle:undefined}
        footer={
          <div className="flex min-w-0 w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {selected?<Link href={learnerCareerCalendarEventTarget(selected)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-primary-text sm:w-auto md:min-h-[var(--lms-control-height)]">
              Open exact round
            </Link>:null}
            <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" type="button" onClick={()=>setSelectedKey(null)}
              >
              Close
            </Button>
          </div>
        }>
        {selected?<dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="font-semibold text-muted-foreground">Scheduled (IST)</dt>
            <dd className="mt-1 text-foreground">{displayDate(selected.start)}</dd></div>
          <div><dt className="font-semibold text-muted-foreground">Round type</dt>
            <dd className="mt-1 text-foreground">{selected.kind}</dd></div>
          <div><dt className="font-semibold text-muted-foreground">Employer</dt>
            <dd className="mt-1 text-foreground">{selected.companyName}</dd></div>
          <div><dt className="font-semibold text-muted-foreground">Role</dt>
            <dd className="mt-1 text-foreground">{selected.roleTitle}</dd></div>
          {selected.rescheduled?<div className="md:col-span-2">
            <dt className="sr-only">Reschedule notice</dt>
            <dd role="status" className="text-body">Approved reschedule applied to this event.</dd>
          </div>:null}
        </dl>:null}
      </Drawer>
    </div>
  );
}
