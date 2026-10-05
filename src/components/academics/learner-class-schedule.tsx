"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  calendarDays,
  eventsForDay,
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
  compact = false,
}: {
  event: LearnerScheduleEvent;
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
    <Link
      href={`/learn/courses/${event.deliveryId}/home`}
      className="block rounded-lg outline-none transition hover:-translate-y-px hover:shadow-sm focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
    >
      {content}
    </Link>
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
}: {
  courses: readonly CourseChoice[];
  sections: readonly SectionChoice[];
  events: readonly LearnerScheduleEvent[];
}) {
  const [view, setView] =
    useState<LearnerScheduleView>("week");
  const [anchor, setAnchor] = useState(
    () => new Date(),
  );
  const [selectedDeliveryIds, setSelectedDeliveryIds] =
    useState(() =>
      courses.map((course) => course.deliveryId),
    );

  const filteredEvents = useMemo(
    () =>
      filterScheduleEvents(
        events,
        selectedDeliveryIds,
      ),
    [events, selectedDeliveryIds],
  );
  const days = useMemo(
    () => calendarDays(anchor, view),
    [anchor, view],
  );
  const now = new Date();
  const todayEvents = eventsForDay(
    events,
    now,
  );
  const upcoming = upcomingScheduleEvents(
    events,
    now,
    3,
  );
  const nextEvent = upcoming[0] ?? null;
  const selected = new Set(
    selectedDeliveryIds,
  );

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
              <EventCard
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
              onClick={() =>
                setAnchor((current) =>
                  shiftCalendarAnchor(
                    current,
                    view,
                    -1,
                  ),
                )
              }
            >
              ←
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setAnchor(new Date())
              }
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label="Next period"
              onClick={() =>
                setAnchor((current) =>
                  shiftCalendarAnchor(
                    current,
                    view,
                    1,
                  ),
                )
              }
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

        {filteredEvents.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No scheduled classes in this view"
              description="Try another date, view, or Course filter. General Section events remain visible even when Courses are filtered."
            />
          </div>
        ) : (
          <>
            <div className="mt-5 hidden md:block">
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
                        eventsForDay(
                          filteredEvents,
                          day,
                        );
                      const inMonth =
                        day.getMonth() ===
                        anchor.getMonth();
                      const isToday =
                        localDayKey(day) ===
                        localDayKey(new Date());

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
                                <EventCard
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
                      eventsForDay(
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
                                <EventCard
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

            <div className="mt-5 space-y-4 md:hidden">
              {days
                .map((day) => ({
                  day,
                  events: eventsForDay(
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
                          <EventCard
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
