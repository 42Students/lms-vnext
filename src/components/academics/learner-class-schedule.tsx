"use client";
import { Input } from "@/components/ui/input";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
import styles from "./learner-class-schedule.module.css";

import { Disclosure } from "@/components/ui/disclosure";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { eventsForLearnerIstScheduleDay, learnerIstScheduleToday, learnerScheduleDateFromDay } from "@/modules/academics/learner-ist-schedule-model";
import { filterLearnerScheduleSections } from "@/modules/academics/learner-schedule-section-filter-model";
import { filterLearnerScheduleBySearch } from "@/modules/academics/learner-schedule-search-model";
import { filterLearnerScheduleByKind, type LearnerScheduleKind } from "@/modules/academics/learner-schedule-kind-filter-model";
import { filterLearnerScheduleUpcoming } from "@/modules/academics/learner-schedule-upcoming-model";
import { learnerScheduleResetFilters } from "@/modules/academics/learner-schedule-filter-reset-model";
import { learnerScheduleSelectedDeliveries } from "@/modules/academics/learner-schedule-selected-deliveries-model";
import { learnerScheduleClock } from "@/modules/academics/learner-schedule-clock-model";
import { learnerScheduleDayAfterShift } from "@/modules/academics/learner-schedule-shift-day-model";
import { learnerScheduleAnchorForView } from "@/modules/academics/learner-schedule-view-anchor-model";
import { learnerScheduleTodayDay } from "@/modules/academics/learner-schedule-today-day-model";
import { learnerScheduleWeekdayExportAvailable } from "@/modules/academics/learner-schedule-weekday-export-model";
import { learnerScheduleDayIcs } from "@/modules/academics/learner-schedule-day-ics-model";
import { learnerClassSessionNotes } from "@/modules/academics/learner-session-detail-model";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FilterChip } from "@/components/ui/filter-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { istCalendarDay, istDayAgenda, istMonthGridKeys } from "./learner-ist-month-model";
import {
  calendarDays,
  eventsForDay as eventsForLocalDay,
  filterScheduleEvents,
  localDayKey,
  shiftCalendarAnchor,
  upcomingScheduleEvents,
  type LearnerScheduleView,
} from "./learner-schedule-model";

type CourseChoice = {
  deliveryId: string;
  sectionId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
};

type SectionChoice = {
  sectionId: string;
  sectionName: string;
  sectionCode: string;
  academicPeriodName: string;
};

export type LearnerScheduleEvent = {
  id: string;
  sectionId: string;
  sectionName: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  location: string | null;
  facultyName: string | null;
  deliveryId: string | null;
  courseId: string | null;
  courseName: string | null;
  courseCode: string | null;
};

function dateLabel(
  anchor: Date,
  view: LearnerScheduleView,
) {
  if (view === "month") {
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(anchor);
  }

  if (view === "day") {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(anchor);
  }

  const days = calendarDays(anchor, "week");
  const start = days[0]!;
  const end = days[6]!;
  return `${new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(start)} – ${new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end)}`;
}

function timeRange(event: LearnerScheduleEvent) {
  const formatter = new Intl.DateTimeFormat(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    },
  );

  return `${formatter.format(
    new Date(event.startsAt),
  )} – ${formatter.format(
    new Date(event.endsAt),
  )}`;
}

function dayHeading(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function EventNotes({description}: {description:string|null}) {
  const notes=learnerClassSessionNotes(description);
  if(!notes)return null;
  return (
    <Disclosure title="Session details" className="border-t border-border px-3 py-2 text-sm text-body">
      <p className="mt-2 whitespace-pre-wrap break-words leading-6">{notes}</p>
    </Disclosure>
  );
}

/** A stable, semantic-token colour per course (never a random colour per render).
 * Course code remains visible so meaning is not conveyed through colour alone. */
function learnerCourseTint(event:LearnerScheduleEvent){
  const key=event.courseId??event.courseName??event.sectionId;
  let hash=0;
  for(const char of key)hash=(Math.imul(hash,31)+char.charCodeAt(0))|0;
  return ["border-l-primary","border-l-success","border-l-warning","border-l-info"][Math.abs(hash%4)]!;
}
function scheduleEventTooltip(event:LearnerScheduleEvent){
  return [
    "Course: "+(event.courseName??"General section event"),
    "Class: "+event.sectionName,
    "Location: "+(event.location??"Not specified"),
    "Time: "+timeRange(event),
  ].join("\n");
}

function learnerEventStartHour(event:LearnerScheduleEvent){
  const value=new Intl.DateTimeFormat("en-IN",{
    timeZone:"Asia/Kolkata",hour:"2-digit",hourCycle:"h23",
  }).format(new Date(event.startsAt));
  return Number(value);
}
function learnerHourlySlots(events:readonly LearnerScheduleEvent[]){
  const starts=events.map(learnerEventStartHour).filter(Number.isFinite);
  const first=Math.max(0,Math.min(7,...starts));
  const last=Math.min(23,Math.max(20,...starts));
  return Array.from({length:last-first+1},(_,index)=>first+index);
}
function learnerHourLabel(hour:number){
  return String(hour%12||12)+":00 "+(hour<12?"AM":"PM");
}
function LearnerHourlyGrid({days,eventsForDay,courseBasePath,onSelectDay}:{
  days:readonly Date[];
  eventsForDay:(day:Date)=>LearnerScheduleEvent[];
  courseBasePath:string;
  onSelectDay:(day:Date)=>void;
}){
  const columns=days.map(day=>({day,rows:eventsForDay(day)}));
  const hours=learnerHourlySlots(columns.flatMap(col=>col.rows));
  return <div className={styles.hourFrame} aria-label="Hourly class schedule">
    <div className={styles.hourGrid+" "+(days.length===1?"grid-cols-[55px_minmax(17.5rem,1fr)] sm:grid-cols-[70px_minmax(17.5rem,1fr)] lg:grid-cols-[90px_minmax(17.5rem,1fr)]":"grid-cols-[55px_repeat(7,minmax(9.375rem,1fr))] sm:grid-cols-[70px_repeat(7,minmax(9.375rem,1fr))] lg:grid-cols-[90px_repeat(7,minmax(9.375rem,1fr))]")}>
      <div className={styles.hourHeader}>ALL DAY</div>
      {columns.map(col=><div key={localDayKey(col.day)}
        className={styles.hourDayHeader}>
        {dayHeading(col.day)}
      </div>)}
      {hours.map(hour=><Fragment key={hour}>
        <div className={styles.hourHeader+" text-right"}>
          {learnerHourLabel(hour)}
        </div>
        {columns.map(col=>{
          const starts=col.rows.filter(event=>learnerEventStartHour(event)===hour);
          return <div key={localDayKey(col.day)+":"+hour}
            className={styles.hourCell}>
            {starts.length?<div className="space-y-1">
              {starts.map(event=><EventCard key={event.id} event={event}
                courseBasePath={courseBasePath} compact/>)}
            </div>:<Button variant="secondary" type="button"
              onClick={()=>onSelectDay(col.day)}
              aria-label={"See "+dayHeading(col.day)+" at "+learnerHourLabel(hour)}
              className={styles.emptyHour}>
              <span className="sr-only">No class scheduled. Open this day.</span>
            </Button>}
          </div>;
        })}
      </Fragment>)}
    </div>
  </div>;
}

function EventCard({
  event,
  courseBasePath,
  compact = false,
}: {
  event: LearnerScheduleEvent;
  courseBasePath: string;
  compact?: boolean;
}) {
  const content = (
    <div
      title={scheduleEventTooltip(event)}
      className={
        (compact
          ? styles.eventCard+" px-3 py-2 "
          : styles.eventCard+" p-3 ") +
        "border-l-4 " + learnerCourseTint(event)
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {event.courseName ? (
          <StatusBadge tone="info">
            {event.courseCode ||
              event.courseName}
          </StatusBadge>
        ) : (
          <StatusBadge>
            Section
          </StatusBadge>
        )}
        <span className="text-xs font-semibold text-muted-foreground">
          {timeRange(event)}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">
        {[event.title.trim() || "Scheduled Class", event.courseName ? event.courseName + " (" + event.sectionName + ")" : null].filter(Boolean).join(" · ")}
      </p>
      <p className="mt-1 text-xs leading-5 text-body">
        {[
          event.courseName,
          event.facultyName,
          event.location,
          event.sectionName,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );

  return event.deliveryId ? (
    <div className="overflow-hidden rounded-[var(--lms-control-radius)] border border-border bg-surface">
      <Link
        href={`${courseBasePath}/${event.deliveryId}${courseBasePath === "/learn/courses" || courseBasePath === "/teacher/courses" ? "/home" : ""}`}
        className="block rounded-[var(--lms-control-radius)] outline-none transition-colors duration-150 hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
      >
        {content}
      </Link>
      <EventNotes description={event.description} />
      {courseBasePath === "/teacher/courses" ? (
        <Link
          href={`${courseBasePath}/${encodeURIComponent(event.deliveryId)}/attendanceDetail?sessionId=${encodeURIComponent(event.id)}`}
          aria-label={`Open attendance for ${event.title}`}
          className="flex min-h-11 items-center border-t border-border px-3 py-2 text-xs font-[650] text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 rounded-[var(--lms-control-radius)] text-sm"
        >
          Open class attendance
        </Link>
      ) : null}
    </div>
  ) : (
    <div className="min-w-0 overflow-hidden rounded-[var(--lms-control-radius)] border border-border bg-surface">
      {content}
      <EventNotes description={event.description} />
    </div>
  );
}

function nextMetricTime(event: LearnerScheduleEvent, now: Date) {
  const day = istCalendarDay(new Date(event.startsAt));
  const today = istCalendarDay(now);
  const tomorrow = istCalendarDay(new Date(now.getTime() + 86_400_000));
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }).format(new Date(event.startsAt));
  if (day === today) return "Today " + time;
  if (day === tomorrow) return "Tomorrow " + time;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short", timeZone: "Asia/Kolkata",
  }).format(new Date(event.startsAt)) + " " + time;
}

function Metric({
  label, value, onClick, expanded,
}: {
  label: "Today" | "Next"; value: string;
  onClick: () => void; expanded: boolean;
}) {
  return <Button type="button" variant="secondary" onClick={onClick}
    aria-label={label + ": " + value} aria-haspopup="dialog" aria-expanded={expanded}
    className={"!min-h-9 gap-2 rounded-full border px-3 py-1 text-xs font-semibold " +
      (label === "Today" ? "border-primary/30 text-primary-text" : "border-success/30 text-success")}>
    {label === "Today" ? <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
      <rect x="2.5" y="4" width="15" height="13.5" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M6.5 2v4M13.5 2v4M2.5 8h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg> : <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M10 5.5v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>}
    <span className="truncate">{value}</span>
  </Button>;
}

export function LearnerClassSchedule({
  courses,
  sections,
  events,
  metricEvents,
  courseLookupWarning,
  metricsWarning,
  courseBasePath = "/learn/courses",
  initialView = "week",
  initialAnchor,
  initialSelectedDeliveryIds,
  initialAnchorDay,
  calendarMode = "LOCAL",
}: {
  courses: readonly CourseChoice[];
  sections: readonly SectionChoice[];
  events: readonly LearnerScheduleEvent[];
  metricEvents?: readonly LearnerScheduleEvent[];
  courseLookupWarning?: string | null;
  metricsWarning?: string | null;
  courseBasePath?: string;
  initialView?: LearnerScheduleView;
  initialAnchor?: Date;
  initialAnchorDay?: string;
  calendarMode?: "LOCAL" | "IST";
  initialSelectedDeliveryIds?: readonly string[];
}) {
  const router = useRouter();
  const [navigationPending, startNavigation] = useTransition();
  const [overflowDay, setOverflowDay] = useState<string | null>(null);
  const [metricDialog, setMetricDialog] = useState<"TODAY" | "NEXT" | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<LearnerScheduleEvent | null>(null);
  const [dismissedWarnings, setDismissedWarnings] = useState<string[]>([]);
  const [view, setView] =
    useState<LearnerScheduleView>(initialView);
  const [chosenDay, setChosenDay] = useState(() => initialAnchorDay ?? istCalendarDay(initialAnchor ?? new Date()));
  // The legacy learner schedule opens its compact month calendar on phones.
  useEffect(()=>{
    if(courseBasePath!=="/learn/courses")return;
    let live=true;
    void Promise.resolve().then(()=>{
      if(live&&window.matchMedia("(max-width: 767px)").matches)setView("month");
    });
    return ()=>{live=false;};
  },[courseBasePath]);

  const [anchor, setAnchor] = useState(
    () => initialAnchorDay ? learnerScheduleDateFromDay(initialAnchorDay) : initialAnchor ?? new Date(),
  );
  // A navigation to a new month remounts the server's authorized event window
  // without duplicating its identity and college access checks in the browser.
  useEffect(() => {
    if (!initialAnchorDay || courseBasePath !== "/learn/courses") return;
    setAnchor(learnerScheduleDateFromDay(initialAnchorDay));
    setChosenDay(initialAnchorDay);
  }, [initialAnchorDay, courseBasePath]);
  const loadedMonth = initialAnchorDay?.slice(0, 7) ??
    localDayKey(initialAnchor ?? new Date()).slice(0, 7);
  const visibleMonth = localDayKey(anchor).slice(0, 7);
  const waitingForMonth = courseBasePath === "/learn/courses" &&
    visibleMonth !== loadedMonth;
  const [sectionId, setSectionId] = useState("");
  const [sessionSearch,setSessionSearch]=useState("");
  const [sessionKind,setSessionKind]=useState<LearnerScheduleKind>("ALL");
  const [upcomingOnly,setUpcomingOnly]=useState(false);
  const [filterNowMs,setFilterNowMs]=useState(()=>Date.now());
  useEffect(()=>{
    const id=window.setInterval(()=>setFilterNowMs(Date.now()),60_000);
    return ()=>window.clearInterval(id);
  },[]);
  const [selectedDeliveryIds, setSelectedDeliveryIds] =
    useState(() => learnerScheduleSelectedDeliveries(courses,initialSelectedDeliveryIds));

  const filteredEvents = useMemo(
    () =>
      filterLearnerScheduleUpcoming(filterLearnerScheduleByKind(filterLearnerScheduleBySearch(filterLearnerScheduleSections(filterScheduleEvents(
        events,
        selectedDeliveryIds,
      ), sectionId),sessionSearch),sessionKind),upcomingOnly,filterNowMs),
    [events, selectedDeliveryIds, sectionId,sessionSearch,sessionKind,upcomingOnly,filterNowMs],
  );
  const filteredMetrics = useMemo(
    () => filterLearnerScheduleUpcoming(filterLearnerScheduleByKind(filterLearnerScheduleBySearch(filterLearnerScheduleSections(filterScheduleEvents(
      metricEvents ?? events, selectedDeliveryIds,
    ), sectionId), sessionSearch), sessionKind), upcomingOnly, filterNowMs),
    [metricEvents, events, selectedDeliveryIds, sectionId, sessionSearch, sessionKind, upcomingOnly, filterNowMs],
  );
  const days = useMemo(
    () => calendarDays(anchor, view),
    [anchor, view],
  );
  // Do not render events from the previous fetched month as if they belonged
  // to the new selected period while Next is replacing its server payload.
  const visibleEvents = waitingForMonth ? [] : filteredEvents;
  // One scheduled clock drives upcoming-only, Today and Next summaries.
  const now = learnerScheduleClock(filterNowMs);
  const calendarToday = calendarMode === "IST" ? learnerIstScheduleToday(now) : now;
  function scheduleEventsForDay(rows: readonly LearnerScheduleEvent[], day: Date) {
    return calendarMode === "IST" ? eventsForLearnerIstScheduleDay(rows, day) : eventsForLocalDay(rows, day);
  }
  // Today and Next follow the independent authorized 180-day horizon.
  const todayEvents = scheduleEventsForDay(
    filteredMetrics,
    calendarToday,
  );
  const upcoming = upcomingScheduleEvents(
    filteredMetrics,
    now,
    3,
  );
  const nextEvent = upcoming[0] ?? null;
  const activeNextEvent = selectedEvent ?? nextEvent;
  const selected = new Set(
    selectedDeliveryIds,
  );
  const monthKeys=useMemo(()=>istMonthGridKeys(anchor.getFullYear(),anchor.getMonth()+1),[anchor]);
  const agenda=useMemo(()=>istDayAgenda(visibleEvents,chosenDay),[visibleEvents,chosenDay]);
  const overflowEvents=useMemo(()=>overflowDay?istDayAgenda(visibleEvents,overflowDay):[],
    [visibleEvents,overflowDay]);
  const dayIcs=useMemo(()=>learnerScheduleDayIcs(agenda,chosenDay),[agenda,chosenDay]);
  function navigateCalendarWindow(next: Date, nextView: LearnerScheduleView = view) {
    if (courseBasePath !== "/learn/courses") return;
    const nextMonth = localDayKey(next).slice(0, 7);
    if (nextMonth === loadedMonth || nextMonth < "2000-01" || nextMonth > "2199-12") return;
    const search = new URLSearchParams(window.location.search);
    search.set("month", nextMonth);
    search.set("view", nextView);
    startNavigation(() => {
      router.replace(window.location.pathname + "?" + search.toString(), { scroll: false });
    });
  }
  function movePeriod(direction:-1|1) {
    const next=shiftCalendarAnchor(anchor,view,direction);
    const nextMonth=localDayKey(next).slice(0,7);
    if(nextMonth<"2000-01"||nextMonth>"2199-12")return;
    setAnchor(next);
    setChosenDay(learnerScheduleDayAfterShift(next,view));
    navigateCalendarWindow(next);
  }


  function toggleCourse(deliveryId: string) {
    setSelectedDeliveryIds((current) =>
      current.includes(deliveryId)
        ? current.filter(
            (id) => id !== deliveryId,
          )
        : [...current, deliveryId],
    );
  }

  if (
    events.length === 0 &&
    sections.length === 0
  ) {
    return (
      <EmptyState
        title="You are not assigned to a class yet"
        description="Your schedule will appear here once your class assignment is complete."
      />
    );
  }

  return (
    <div data-learner-schedule={courseBasePath === "/learn/courses" ? "true" : undefined} className={"min-w-0 space-y-4 md:space-y-6 "+styles.root}>
      <Dialog open={metricDialog !== null}
        onOpenChange={open => { if (!open) { setMetricDialog(null); setSelectedEvent(null); } }}
        title={metricDialog === "TODAY" ? "Today's Classes" :
          (activeNextEvent?.courseName || activeNextEvent?.title || "Next Class").slice(0, 18)}>
        {metricDialog === "TODAY" ? <div className="space-y-3">
          {todayEvents.length ? todayEvents.map(event =>
            <div key={event.id} className="flex min-w-0 justify-between gap-3 border-b border-border py-2 last:border-0">
              <span className="min-w-0 break-words text-sm font-semibold text-foreground">
                {event.courseName || event.title || "Scheduled Class"}
              </span>
              <span className="shrink-0 text-sm text-body">
                {new Intl.DateTimeFormat("en-US", {hour:"numeric",minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata"})
                  .format(new Date(event.startsAt))}
              </span>
            </div>) : <p className="text-sm text-muted-foreground">No classes today.</p>}
        </div> : activeNextEvent ? <dl className="grid gap-3 text-sm">
          <div><dt className="font-semibold">Course</dt><dd>{activeNextEvent.courseName || "Scheduled Class"}</dd></div>
          <div><dt className="font-semibold">Time</dt><dd>{timeRange(activeNextEvent)}</dd></div>
          <div><dt className="font-semibold">Date</dt><dd>{new Intl.DateTimeFormat("en-IN", {
            weekday:"short",month:"short",day:"numeric",year:"numeric",timeZone:"Asia/Kolkata"
          }).format(new Date(activeNextEvent.startsAt))}</dd></div>
          {activeNextEvent.facultyName ? <div><dt className="font-semibold">Faculty</dt>
            <dd>{activeNextEvent.facultyName}</dd></div> : null}
          {activeNextEvent.location ? <div><dt className="font-semibold">Room</dt>
            <dd>{activeNextEvent.location}</dd></div> : null}
        </dl> : <p className="text-sm text-muted-foreground">No upcoming classes.</p>}
      </Dialog>
      <Dialog open={overflowDay !== null} onOpenChange={open=>{if(!open)setOverflowDay(null);}}
        title={overflowDay ? "Classes on " + overflowDay : "Classes"}
        description="All authorized sessions on the selected day">
        <div className="min-w-0 space-y-3">
          {overflowEvents.map(event=><EventCard key={event.id}
            event={event} courseBasePath={courseBasePath} />)}
          {!overflowEvents.length ? <p className="text-sm text-muted-foreground">
            No sessions found for this day.</p> : null}
        </div>
      </Dialog>
      {courseLookupWarning && !dismissedWarnings.includes("courses") ? (
        <Alert tone="warning">{courseLookupWarning}
          <span className="ml-2 inline-flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => router.refresh()}>Retry</Button>
            <Button type="button" variant="ghost" onClick={() => setDismissedWarnings(current => [...current, "courses"])}>Dismiss</Button>
          </span>
        </Alert>
      ) : null}
      {metricsWarning && !dismissedWarnings.includes("metrics") ? (
        <Alert tone="warning">{metricsWarning}
          <span className="ml-2 inline-flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => router.refresh()}>Retry</Button>
            <Button type="button" variant="ghost" onClick={() => setDismissedWarnings(current => [...current, "metrics"])}>Dismiss</Button>
          </span>
        </Alert>
      ) : null}
      {filteredMetrics.length > 0 ? (
        <div className={styles.summary + " flex flex-wrap items-center gap-2"} aria-label="Class schedule overview">
          <Metric label="Today" value={todayEvents.length + " today"}
            expanded={metricDialog === "TODAY"}
            onClick={() => { setSelectedEvent(null); setMetricDialog("TODAY"); }} />
          <Metric label="Next" value={nextEvent
            ? "Next: " + nextMetricTime(nextEvent, now)
            : metricsWarning ? "Upcoming classes unavailable" : "No upcoming classes"}
            expanded={metricDialog === "NEXT"}
            onClick={() => { setSelectedEvent(null); setMetricDialog("NEXT"); }} />
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <section aria-label="Next classes" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Next classes</h2>
            <span className="text-xs font-semibold text-muted-foreground">Next 3 upcoming</span>
          </div>
          <div className={styles.upcomingList}>
            {upcoming.map(event => (
              <Button key={event.id} type="button" variant="ghost"
                aria-label={"View next class: " + (event.courseName || event.title || "Scheduled Class")}
                className="!h-auto !min-h-14 !w-full !justify-start !whitespace-normal rounded-md border-b border-border py-3 text-left last:border-0"
                onClick={() => { setSelectedEvent(event); setMetricDialog("NEXT"); }}>
                <span className="grid w-full min-w-0 grid-cols-[minmax(6rem,auto)_minmax(0,1fr)_minmax(6rem,auto)] items-center gap-3">
                  <span className="text-xs font-semibold text-primary-text">
                    {new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric",timeZone:"Asia/Kolkata"})
                      .format(new Date(event.startsAt))}
                  </span>
                  <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                    {event.courseName || event.title || "Scheduled Class"}
                  </span>
                  <span className="text-right text-xs text-body">
                    {new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata"})
                      .format(new Date(event.startsAt))}
                    {event.facultyName ? <span className="block max-w-[150px] truncate">{event.facultyName}</span> : null}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.calendarCard}>
        {navigationPending || waitingForMonth ? <p role="status" aria-live="polite"
          className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
          Loading the selected schedule period…
        </p> : null}
        <div className={styles.toolbar}>
          <div className={styles.nav}>
            <Button
              className={styles.arrow}
              size="sm"
              variant="secondary"
              aria-label="Previous period"
              onClick={() => movePeriod(-1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path d="m14 5-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
            <Button
              className={styles.today}
              size="sm"
              variant="secondary"
              onClick={() => {
                const instant=new Date();
                const next=calendarMode === "IST" ? learnerIstScheduleToday(instant) : instant;
                setAnchor(next);
                setChosenDay(learnerScheduleTodayDay(instant,calendarMode));
                navigateCalendarWindow(next);
              }}
            >
              Today
            </Button>
            <Button
              className={styles.arrow}
              size="sm"
              variant="secondary"
              aria-label="Next period"
              onClick={() => movePeriod(1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path d="m10 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
            <span className={styles.period+" break-words"}>
              {dateLabel(anchor, view)}
            </span>
          </div>

          <div className={styles.actions}>
            <Select aria-label="Calendar view"
              value={view}
              onChange={(event) => {
                const next = learnerScheduleAnchorForView(chosenDay,anchor);
                const nextView = event.target.value as LearnerScheduleView;
                setAnchor(next);
                setView(nextView);
                navigateCalendarWindow(next,nextView);
              }}
              className={styles.viewSelect}
            >
              <option value="month">
                Month
              </option>
              <option value="week">
                Week
              </option>
              <option value="day">
                Day
              </option>
            </Select>
          </div>
        </div>

        {courseBasePath === "/learn/courses" ? (
          <Disclosure title="Filters" defaultOpen={Boolean(sessionSearch || sessionKind !== "ALL" || upcomingOnly)} className="border-b border-border" contentClassName="pb-2">
          <div className={styles.filters+" min-w-0"}>
            <label className="min-w-0 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Find sessions
              <Input type="search" value={sessionSearch} maxLength={100}
                onChange={event=>setSessionSearch(event.target.value)}
                placeholder="Class title, faculty, location or course"
                className="mt-1.5 min-h-11 w-full min-w-0 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-background px-3 text-sm font-normal text-foreground" />
            </label>
            {sessionSearch ? <Button variant="secondary" type="button" onClick={()=>setSessionSearch("")}
              >
              Clear search
            </Button> : null}
            <label className="min-w-44 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Session kind
              <Select value={sessionKind} onChange={event=>setSessionKind(event.target.value as LearnerScheduleKind)}
                className="mt-1.5 min-h-11 w-full min-w-0 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-background px-3 text-sm text-foreground">
                <option value="ALL">All sessions</option>
                <option value="COURSE">Course classes only</option>
                <option value="SECTION">General section events</option>
              </Select>
            </label>
            <FilterChip type="button" aria-pressed={upcomingOnly}
              onClick={()=>setUpcomingOnly(value=>!value)}>
              Upcoming sessions only
            </FilterChip>
            <Button variant="secondary" type="button" onClick={() => {
              const reset = learnerScheduleResetFilters(courses);
              setSessionSearch(reset.search);setSessionKind(reset.kind);
              setSectionId(reset.sectionId);setUpcomingOnly(reset.upcomingOnly);
              setSelectedDeliveryIds(reset.deliveryIds);
            }} >
              Clear schedule filters
            </Button>
            <span role="status" className="w-full text-sm text-muted-foreground">
              {filteredEvents.length} matching authorized sessions
            </span>
          </div>
          </Disclosure>
        ) : null}
        {sections.length > 1 ? (
          <label className="mt-3 block max-w-sm border-t border-border pt-3 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Section
            <Select value={sectionId} onChange={event => setSectionId(event.target.value)}
              aria-label="Filter class schedule by section" className="mt-1.5 min-h-11 md:min-h-9 w-full">
              <option value="">All my sections</option>
              {sections.map(section => <option key={section.sectionId} value={section.sectionId}>
                {section.sectionName} · {section.academicPeriodName}
              </option>)}
            </Select>
          </label>
        ) : null}
        {courses.length > 1 ? (
          <div className={styles.courseFilter+" min-w-0"}>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Courses
              </span>
              <Button type="button" size="sm" variant={
                selectedDeliveryIds.length === courses.length ? "primary" : "secondary"}
                onClick={() => setSelectedDeliveryIds(courses.map(course => course.deliveryId))}>
                All courses
              </Button>
              <Button type="button" size="sm" variant="secondary"
                onClick={() => setSelectedDeliveryIds([])} disabled={!selectedDeliveryIds.length}>
                Clear courses
              </Button>
              {courses.map((course) => (
                <FilterChip
                  key={course.deliveryId}
                  aria-pressed={selected.has(course.deliveryId)}
                  onClick={() => toggleCourse(course.deliveryId)}
                >
                  {course.courseCode}
                </FilterChip>
              ))}
            </div>
          </div>
        ) : null}

        {visibleEvents.length === 0 && view !== "month" && !waitingForMonth ? (
          <div className="mt-5">
            <EmptyState
              title={"No scheduled classes this " + view + "."}
              description="Try another date, view, section, Course filter or session search. General Section events remain visible unless a search excludes them."
            />
          </div>
        ) : (
          <>
            {view === "month" ? (
              <div className={styles.month} aria-label="Monthly class schedule">
                <CalendarGrid variant="hairline" className={styles.monthGrid}
                  role="group" aria-label="42 day month grid">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day,index)=>(
                    <span key={day} className={styles.weekday+" "+(index===0?calendarStyles.calendarSunday:"")}>
                      {day}
                    </span>
                  ))}
                  {monthKeys.map(day=>{
                    const dayItems=istDayAgenda(visibleEvents,day);
                    const inside=day.slice(0,7)===
                      anchor.getFullYear()+"-"+String(anchor.getMonth()+1).padStart(2,"0");
                    const selected=chosenDay===day;
                    return <Button key={day} variant="ghost" type="button"
                      data-outside={!inside}
                      aria-current={day === istCalendarDay(calendarToday) ? "date" : undefined}
                      aria-disabled={!inside}
                      aria-label={day+", "+dayItems.length+" classes"}
                      aria-pressed={selected}
                      onClick={() => {
                        if (!inside) return;
                        setChosenDay(day);
                        if (!window.matchMedia("(max-width: 767px)").matches) {
                          const next = learnerScheduleDateFromDay(day);
                          setAnchor(next);setView("day");navigateCalendarWindow(next,"day");
                        } else {
                          document.getElementById("learner-selected-day-agenda")?.scrollIntoView({
                            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
                            block: "nearest",
                          });
                        }
                      }}
                      className={styles.monthDay+" !block !w-full !min-h-16 md:!min-h-24 !justify-start"}>
                      <span className="block text-xs font-semibold">{Number(day.slice(8))}</span>
                      {dayItems.length ? <span aria-hidden="true" className="mt-1 flex flex-wrap gap-0.5">
                        {dayItems.slice(0,3).map(event=><span key={event.id} className={"size-1.5 rounded-[50%] bg-primary " +
                          (learnerCourseTint(event)==="border-l-success"?"bg-success":
                            learnerCourseTint(event)==="border-l-warning"?"bg-warning":
                            learnerCourseTint(event)==="border-l-info"?"bg-info":"bg-primary")}/>)}
                      </span>:null}
                      {dayItems.length ? <span className="mt-1 block break-words text-xs font-semibold text-primary-text">
                        {dayItems.length} {dayItems.length===1?"class":"classes"}
                      </span> : null}
                      {dayItems.length>3 ? <span className="mt-1 block text-xs font-semibold text-primary-text underline">
                        +{dayItems.length-3} more · view all
                      </span> : null}
                    </Button>;
                  })}
                </CalendarGrid>
                <section id="learner-selected-day-agenda" className={styles.selectedAgenda} aria-label="Selected day agenda">
                  <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      {chosenDay} · {agenda.length} {agenda.length===1?"class":"classes"}
                    </h3>
                    {agenda.length ? <a download={"classes-"+chosenDay+".ics"}
                      href={"data:text/calendar;charset=utf-8,"+encodeURIComponent(dayIcs.content)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text sm:w-auto hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                      Download selected day (.ics)
                    </a> : null}
                  </div>
                  {dayIcs.truncated ? <p className="mt-2 text-xs text-warning-foreground">Export includes the first 100 selected sessions only.</p> : null}
                  {agenda.length ? <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {agenda.map(event=><EventCard key={event.id} event={event} courseBasePath={courseBasePath}/>)}
                  </div> : <p className="mt-2 text-sm text-muted-foreground">No classes on this day.</p>}
                </section>
              </div>
            ) : null}
            {courseBasePath === "/learn/courses" && learnerScheduleWeekdayExportAvailable(view,calendarMode,agenda.length) ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3" aria-label="Selected day class export">
                <p className="min-w-0 text-sm font-semibold text-body">{chosenDay} · {agenda.length} authorized sessions</p>
                <a download={"classes-"+chosenDay+".ics"}
                  href={"data:text/calendar;charset=utf-8,"+encodeURIComponent(dayIcs.content)}
                  className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                  Download selected day (.ics)
                </a>
                {dayIcs.truncated ? <p className="w-full text-xs text-warning-foreground">Export includes the first 100 selected sessions only.</p> : null}
              </div>
            ) : null}
            <div className={view==="month" ? "hidden" : "mt-5 hidden md:block"}>
              {view === "month" ? (
                <>
                  <div className="grid grid-cols-7 border-b border-border text-center text-xs font-semibold text-muted-foreground">
                    {[
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                    ].map((label) => (
                      <div
                        key={label}
                        className="px-2 py-2"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {days.map((day) => {
                      const dayEvents =
                        scheduleEventsForDay(
                          visibleEvents,
                          day,
                        );
                      const inMonth =
                        day.getMonth() ===
                        anchor.getMonth();
                      const isToday =
                        localDayKey(day) ===
                        localDayKey(calendarToday);

                      return (
                        <div
                          key={localDayKey(day)}
                          className="min-h-32 border-b border-r border-border p-2 first:border-l"
                        >
                          <div className="mb-2 flex items-center justify-between flex-wrap">
                            <span
                              className={
                                isToday
                                  ? "flex h-7 w-7 items-center justify-center rounded-[50%] bg-primary text-xs font-semibold text-on-primary"
                                  : inMonth
                                    ? "text-xs font-semibold text-foreground"
                                    : "text-xs font-semibold text-muted-foreground/60"
                              }
                            >
                              {day.getDate()}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {dayEvents
                              .slice(0, 3)
                              .map((event) => (
                                <EventCard courseBasePath={courseBasePath}
                                  key={event.id}
                                  event={event}
                                  compact
                                />
                              ))}
                            {dayEvents.length > 3 ? (
                              <Button type="button" variant="ghost"
                                className="min-h-9 text-xs font-semibold text-primary-text underline"
                                onClick={()=>setOverflowDay(localDayKey(day))}>
                                +{dayEvents.length-3} more
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <LearnerHourlyGrid days={days}
                  eventsForDay={day=>scheduleEventsForDay(visibleEvents,day)}
                  courseBasePath={courseBasePath}
                  onSelectDay={day=>{
                    setView("day");setAnchor(day);setChosenDay(localDayKey(day));
                  }}/>

              )}
            </div>

            <div className={view==="month" ? "hidden" : "mt-5 space-y-4 md:hidden"}>
              {days
                .map((day) => ({
                  day,
                  events: scheduleEventsForDay(
                    visibleEvents,
                    day,
                  ),
                }))
                .filter(
                  ({ events: dayEvents }) =>
                    view !== "month" ||
                    dayEvents.length > 0,
                )
                .map(({ day, events: dayEvents }) => (
                  <section
                    key={localDayKey(day)}
                    className={styles.agendaDay}
                  >
                    <h3 className="m-0 text-sm font-semibold text-foreground">
                      {dayHeading(day)}
                    </h3>
                    <div className="mt-3 space-y-2">
                      {dayEvents.length > 0 ? (
                        dayEvents.map((event) => (
                          <EventCard courseBasePath={courseBasePath}
                            key={event.id}
                            event={event}
                          />
                        ))
                      ) : (
                        <p className="m-0 text-sm text-muted-foreground">
                          No classes
                        </p>
                      )}
                    </div>
                  </section>
                ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
