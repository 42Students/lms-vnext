"use client";

import Link from "next/link";
import { eventsForLearnerIstScheduleDay, learnerIstScheduleToday, learnerScheduleDateFromDay } from "@/modules/academics/learner-ist-schedule-model";
import { filterLearnerScheduleSections } from "@/modules/academics/learner-schedule-section-filter-model";
import {
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
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
      className={
        compact
          ? "rounded-lg border border-border bg-surface px-3 py-2"
          : "rounded-lg border border-border bg-surface p-3"
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
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <Link
        href={`${courseBasePath}/${event.deliveryId}${courseBasePath === "/learn/courses" || courseBasePath === "/teacher/courses" ? "/home" : ""}`}
        className="block rounded-lg outline-none transition hover:-translate-y-px hover:shadow-sm focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
      >
        {content}
      </Link>
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
    content
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
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
  const [anchor, setAnchor] = useState(
    () => initialAnchorDay ? learnerScheduleDateFromDay(initialAnchorDay) : initialAnchor ?? new Date(),
  );
  const [sectionId, setSectionId] = useState("");
  const [selectedDeliveryIds, setSelectedDeliveryIds] =
    useState(() =>
      initialSelectedDeliveryIds ? [...initialSelectedDeliveryIds] : courses.map((course) => course.deliveryId),
    );

  const filteredEvents = useMemo(
    () =>
      filterLearnerScheduleSections(filterScheduleEvents(
        events,
        selectedDeliveryIds,
      ), sectionId),
    [events, selectedDeliveryIds, sectionId],
  );
  const days = useMemo(
    () => calendarDays(anchor, view),
    [anchor, view],
  );
  const now = new Date();
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
  function movePeriod(direction:-1|1) {
    const next=shiftCalendarAnchor(anchor,view,direction);
    setAnchor(next);
    if(view==="month") {
      const year=next.getFullYear();
      const month=String(next.getMonth()+1).padStart(2,"0");
      setChosenDay(year+"-"+month+"-01");
    }
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
        title="No class assignment yet"
        description="Your schedule will appear here once your College places you in an active Section."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Metric
          label="Today"
          value={`${todayEvents.length} ${todayEvents.length === 1 ? "class" : "classes"}`}
        />
        <Metric
          label="Next"
          value={
            nextEvent
              ? `${new Intl.DateTimeFormat("en-IN", {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "Asia/Kolkata",
                }).format(
                  new Date(nextEvent.startsAt),
                )} · ${nextEvent.courseName || nextEvent.title}`
              : "No upcoming classes"
          }
        />
      </div>

      {upcoming.length > 0 ? (
        <section
          className="rounded-xl border border-border bg-surface p-4"
          aria-label="Next upcoming classes"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-sm font-semibold text-foreground">
              Next classes
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              Next {upcoming.length}
            </span>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
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

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              aria-label="Previous period"
              onClick={() => movePeriod(-1)}
            >
              ←
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                { const instant=new Date(); const next=calendarMode === "IST" ? learnerIstScheduleToday(instant) : instant; setAnchor(next); setChosenDay(calendarMode === "IST" ? localDayKey(next) : istCalendarDay(instant)); }
              }
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label="Next period"
              onClick={() => movePeriod(1)}
            >
              →
            </Button>
            <span className="ml-1 text-sm font-semibold text-foreground">
              {dateLabel(anchor, view)}
            </span>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-body">
            View
            <Select
              value={view}
              onChange={(event) =>
                setView(
                  event.target
                    .value as LearnerScheduleView,
                )
              }
              className="min-w-28"
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

        {sections.length > 1 ? (
          <label className="mt-4 block max-w-sm border-t border-border pt-4 text-xs font-semibold text-body">
            Section
            <Select value={sectionId} onChange={event => setSectionId(event.target.value)}
              aria-label="Filter class schedule by section" className="mt-1.5 min-h-11 w-full">
              <option value="">All my sections</option>
              {sections.map(section => <option key={section.sectionId} value={section.sectionId}>
                {section.sectionName} · {section.academicPeriodName}
              </option>)}
            </Select>
          </label>
        ) : null}
        {courses.length > 1 ? (
          <div className="mt-4 border-t border-border pt-4">
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
                All
              </Button>
              {courses.map((course) => (
                <Button
                  key={course.deliveryId}
                  size="sm"
                  variant={
                    selected.has(
                      course.deliveryId,
                    )
                      ? "primary"
                      : "secondary"
                  }
                  aria-pressed={selected.has(
                    course.deliveryId,
                  )}
                  onClick={() =>
                    toggleCourse(
                      course.deliveryId,
                    )
                  }
                >
                  {course.courseCode}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {filteredEvents.length === 0 && view !== "month" ? (
          <div className="mt-5">
            <EmptyState
              title="No scheduled classes in this view"
              description="Try another date, view, or Course filter. General Section events remain visible even when Courses are filtered."
            />
          </div>
        ) : (
          <>
            {view === "month" ? (
              <div className="mt-5 space-y-4" aria-label="Monthly class schedule">
                <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border"
                  role="group" aria-label="42 day month grid">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=>(
                    <span key={day} className="bg-surface p-1 text-center text-[10px] font-semibold text-muted-foreground sm:p-2 sm:text-xs">
                      {day}
                    </span>
                  ))}
                  {monthKeys.map(day=>{
                    const dayItems=istDayAgenda(filteredEvents,day);
                    const inside=day.slice(0,7)===
                      anchor.getFullYear()+"-"+String(anchor.getMonth()+1).padStart(2,"0");
                    const selected=chosenDay===day;
                    return <button key={day} type="button"
                      aria-label={day+", "+dayItems.length+" classes"}
                      aria-pressed={selected}
                      onClick={()=>setChosenDay(day)}
                      className={"min-h-16 min-w-0 bg-surface p-1 text-left focus-visible:outline-2 focus-visible:outline-primary sm:min-h-24 sm:p-2 "+
                        (selected?"ring-2 ring-inset ring-primary ":"")+
                        (!inside?"text-muted-foreground opacity-60":"text-foreground")}>
                      <span className="block text-xs font-semibold">{Number(day.slice(8))}</span>
                      {dayItems.length ? <span className="mt-1 block break-words text-[10px] font-semibold text-primary-text sm:text-xs">
                        {dayItems.length} {dayItems.length===1?"class":"classes"}
                      </span> : null}
                    </button>;
                  })}
                </div>
                <section className="rounded-xl border border-border bg-surface-subtle p-3 sm:p-4" aria-label="Selected day agenda">
                  <h3 className="text-sm font-semibold text-foreground">
                    {chosenDay} · {agenda.length} {agenda.length===1?"class":"classes"}
                  </h3>
                  {agenda.length ? <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {agenda.map(event=><EventCard key={event.id} event={event} courseBasePath={courseBasePath}/>)}
                  </div> : <p className="mt-2 text-sm text-muted-foreground">No classes on this day.</p>}
                </section>
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
                                  ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary"
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
                <div
                  className={
                    view === "week"
                      ? "grid grid-cols-7 gap-3"
                      : "grid gap-3"
                  }
                >
                  {days.map((day) => {
                    const dayEvents =
                      scheduleEventsForDay(
                        filteredEvents,
                        day,
                      );

                    return (
                      <section
                        key={localDayKey(day)}
                        className="min-w-0 rounded-lg border border-border bg-surface-subtle p-3"
                      >
                        <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          {dayHeading(day)}
                        </h3>
                        <div className="mt-3 space-y-2">
                          {dayEvents.length > 0 ? (
                            dayEvents.map(
                              (event) => (
                                <EventCard courseBasePath={courseBasePath}
                                  key={event.id}
                                  event={event}
                                  compact
                                />
                              ),
                            )
                          ) : (
                            <p className="m-0 text-xs text-muted-foreground">
                              No classes
                            </p>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
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
                    className="rounded-xl border border-border bg-surface-subtle p-4"
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
