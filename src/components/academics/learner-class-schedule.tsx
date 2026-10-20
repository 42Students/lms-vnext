"use client";
import { StatTile } from "@/components/ui/stat-tile";
import { Input } from "@/components/ui/input";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
import styles from "./learner-class-schedule.module.css";

import { Disclosure } from "@/components/ui/disclosure";
import Link from "next/link";
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
} from "react";
import { Button } from "@/components/ui/button";
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
  const key=event.deliveryId??event.courseId??event.sectionId;
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
  const value=new Intl.DateTimeFormat("en-GB",{
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
    <div className={styles.hourGrid+" "+(days.length===1?"grid-cols-[5rem_minmax(280px,1fr)]":"grid-cols-[5rem_repeat(7,minmax(150px,1fr))]")}>
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
        {event.title}
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
        className="block rounded-[var(--lms-control-radius)] outline-none transition hover:-translate-y-px hover:shadow-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
      >
        {content}
      </Link>
      <EventNotes description={event.description} />
      {courseBasePath === "/teacher/courses" ? (
        <Link
          href={`${courseBasePath}/${encodeURIComponent(event.deliveryId)}/attendanceDetail?sessionId=${encodeURIComponent(event.id)}`}
          aria-label={`Open attendance for ${event.title}`}
          className="block border-t border-border px-3 py-2 text-xs font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-primary"
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

function Metric({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return <div title={tooltip}><StatTile label={label} value={value} /></div>;
}

export function LearnerClassSchedule({
  courses,
  sections,
  events,
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
  courseBasePath?: string;
  initialView?: LearnerScheduleView;
  initialAnchor?: Date;
  initialAnchorDay?: string;
  calendarMode?: "LOCAL" | "IST";
  initialSelectedDeliveryIds?: readonly string[];
}) {
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
  const days = useMemo(
    () => calendarDays(anchor, view),
    [anchor, view],
  );
  // One scheduled clock drives upcoming-only, Today and Next summaries.
  const now = learnerScheduleClock(filterNowMs);
  const calendarToday = calendarMode === "IST" ? learnerIstScheduleToday(now) : now;
  function scheduleEventsForDay(rows: readonly LearnerScheduleEvent[], day: Date) {
    return calendarMode === "IST" ? eventsForLearnerIstScheduleDay(rows, day) : eventsForLocalDay(rows, day);
  }
  // Summary cards must use the same authorized, course-filtered event set as the calendar.
  const todayEvents = scheduleEventsForDay(
    filteredEvents,
    calendarToday,
  );
  const upcoming = upcomingScheduleEvents(
    filteredEvents,
    now,
    3,
  );
  const nextEvent = upcoming[0] ?? null;
  const selected = new Set(
    selectedDeliveryIds,
  );
  const monthKeys=useMemo(()=>istMonthGridKeys(anchor.getFullYear(),anchor.getMonth()+1),[anchor]);
  const agenda=useMemo(()=>istDayAgenda(filteredEvents,chosenDay),[filteredEvents,chosenDay]);
  const dayIcs=useMemo(()=>learnerScheduleDayIcs(agenda,chosenDay),[agenda,chosenDay]);
  function movePeriod(direction:-1|1) {
    const next=shiftCalendarAnchor(anchor,view,direction);
    setAnchor(next);
    setChosenDay(learnerScheduleDayAfterShift(next,view));
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
    <div className={"space-y-5 "+styles.root}>
      <div className={styles.summary}>
        <Metric
          label="Today"
          value={todayEvents.length+" today"}
          tooltip={courseBasePath==="/learn/courses"?todayEvents.map(e=>scheduleEventTooltip(e)).join("\n\n"):undefined}
        />
        <Metric
          label="Next"
          tooltip={nextEvent?scheduleEventTooltip(nextEvent):undefined}
          value={
            nextEvent
              ? `${new Intl.DateTimeFormat("en-IN", {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "Asia/Kolkata",
                }).format(
                  new Date(nextEvent.startsAt),
                )} · Next: ${nextEvent.courseName || nextEvent.title}`
              : "No upcoming classes"
          }
        />
      </div>

      {upcoming.length > 0 ? (
        <section
          className={styles.upcoming}
          aria-label="Next upcoming classes"
        >
          <div className={styles.upcomingHead}>
            <h2 className="m-0 text-sm font-semibold text-foreground">
              Next classes
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              Next {upcoming.length}
            </span>
          </div>
          <div className={styles.upcomingList}>
            {upcoming.map((event) => (
              <EventCard courseBasePath={courseBasePath}
                key={event.id}
                event={event}
                compact
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.calendarCard}>
        <div className={styles.toolbar}>
          <div className={styles.nav}>
            <Button
              className={styles.arrow}
              size="sm"
              variant="secondary"
              aria-label="Previous period"
              onClick={() => movePeriod(-1)}
            >
              ←
            </Button>
            <Button
              className={styles.today}
              size="sm"
              variant="secondary"
              onClick={() =>
                { const instant=new Date(); const next=calendarMode === "IST" ? learnerIstScheduleToday(instant) : instant; setAnchor(next); setChosenDay(learnerScheduleTodayDay(instant,calendarMode)); }
              }
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
              →
            </Button>
            <span className={styles.period}>
              {dateLabel(anchor, view)}
            </span>
          </div>

          <label className={styles.actions+" text-xs font-semibold text-body"}>
            View
            <Select
              value={view}
              onChange={(event) => {
                setAnchor(learnerScheduleAnchorForView(chosenDay,anchor));
                setView(event.target.value as LearnerScheduleView);
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
          </label>
        </div>

        {courseBasePath === "/learn/courses" ? (
          <div className={styles.filters}>
            <label className="min-w-0 flex-1 text-xs font-semibold text-body">Find sessions
              <Input type="search" value={sessionSearch} maxLength={100}
                onChange={event=>setSessionSearch(event.target.value)}
                placeholder="Class title, faculty, location or course"
                className="mt-1.5 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-background px-3 text-sm font-normal text-foreground" />
            </label>
            {sessionSearch ? <Button variant="secondary" type="button" onClick={()=>setSessionSearch("")}
              >
              Clear search
            </Button> : null}
            <label className="min-w-44 text-xs font-semibold text-body">Session kind
              <Select value={sessionKind} onChange={event=>setSessionKind(event.target.value as LearnerScheduleKind)}
                className="mt-1.5 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-background px-3 text-sm text-foreground">
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
            <span role="status" className="w-full text-xs text-muted-foreground">
              {filteredEvents.length} matching authorized sessions
            </span>
          </div>
        ) : null}
        {sections.length > 1 ? (
          <label className="mt-4 block max-w-sm border-t border-border pt-4 text-xs font-semibold text-body">
            Section
            <Select value={sectionId} onChange={event => setSectionId(event.target.value)}
              aria-label="Filter class schedule by section" className="mt-1.5 min-h-11 sm:min-h-9 w-full">
              <option value="">All my sections</option>
              {sections.map(section => <option key={section.sectionId} value={section.sectionId}>
                {section.sectionName} · {section.academicPeriodName}
              </option>)}
            </Select>
          </label>
        ) : null}
        {courses.length > 1 ? (
          <div className={styles.courseFilter}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Courses
              </span>
              <Button
                size="sm"
                variant={
                  selectedDeliveryIds.length ===
                  courses.length
                    ? "primary"
                    : "secondary"
                }
                onClick={() =>
                  setSelectedDeliveryIds(
                    courses.map(
                      (course) =>
                        course.deliveryId,
                    ),
                  )
                }
              >
                All courses
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

        {filteredEvents.length === 0 && view !== "month" ? (
          <div className="mt-5">
            <EmptyState
              title={view==="week"?"No scheduled classes this week.":"No scheduled classes in this view"}
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
                    const dayItems=istDayAgenda(filteredEvents,day);
                    const inside=day.slice(0,7)===
                      anchor.getFullYear()+"-"+String(anchor.getMonth()+1).padStart(2,"0");
                    const selected=chosenDay===day;
                    return <Button key={day} variant="ghost" type="button"
                      data-outside={!inside}
                      aria-label={day+", "+dayItems.length+" classes"}
                      aria-pressed={selected}
                      onClick={()=>setChosenDay(day)}
                      className={styles.monthDay+" !block !w-full !min-h-24 !justify-start"}>
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
                    </Button>;
                  })}
                </CalendarGrid>
                <section className={styles.selectedAgenda} aria-label="Selected day agenda">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {chosenDay} · {agenda.length} {agenda.length===1?"class":"classes"}
                    </h3>
                    {agenda.length ? <a download={"classes-"+chosenDay+".ics"}
                      href={"data:text/calendar;charset=utf-8,"+encodeURIComponent(dayIcs.content)}
                      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text">
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
                  className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text">
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
                          filteredEvents,
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
                          <div className="mb-2 flex items-center justify-between">
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
                              <p className="m-0 text-xs font-semibold text-muted-foreground">
                                +
                                {dayEvents.length -
                                  3}{" "}
                                more
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <LearnerHourlyGrid days={days}
                  eventsForDay={day=>scheduleEventsForDay(filteredEvents,day)}
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
                    filteredEvents,
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
