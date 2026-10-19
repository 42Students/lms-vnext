import { Tabs } from "@/components/ui/tabs";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getCurrentRequestContext,
} from "@/auth/request-context";
import {
  PageHeader,
} from "@/components/ui/page-header";
import {
  StatusBadge,
} from "@/components/ui/status-badge";

import {
  parseActivityDateBoundary,
} from "@/modules/activity/date-boundary";
import {
  hasActiveRecruiter,
} from "@/modules/identity/context";

import {
  shiftCareerCalendarDay,
} from "@/modules/placements/learner-career-calendar-model";
import {
  placementCalendarDayKey,
  placementCalendarWindow,
  type PlacementCalendarEvent,
  type PlacementCalendarView,
} from "@/modules/placements/placement-calendar-model";
import {
  listRecruiterCalendarEvents,
} from "@/modules/placements/recruiter-calendar-service";
import { combineHrCalendarDays, hrResultsDueHref, selectHrMobileCalendarDays } from "@/modules/placements/hr-calendar-day-model";
import {hrNextCalendarEvent} from "@/modules/placements/hr-calendar-next-event-model";
import {HR_CALENDAR_CATEGORIES,hrCalendarCategorySchema,filterHrCalendarDays,type HrCalendarCategory} from "@/modules/placements/hr-calendar-category-model";

export const dynamic = "force-dynamic";

type SearchParams = {
  date?: string | string[];
  view?: string | string[];
  category?:string|string[];
};

const VIEWS: readonly PlacementCalendarView[] = [
  "week",
  "month",
  "agenda",
];

function first(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function validDay(
  value: string | undefined,
  fallback: string,
) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fallback;
  }

  try {
    parseActivityDateBoundary(value, "from");
    return value;
  } catch {
    return fallback;
  }
}

function calendarHref(
  date: string,
  view: PlacementCalendarView,
  category:HrCalendarCategory="ALL",
) {
  const params = new URLSearchParams({
    date,
    view,
    category,
  });

  return `/hr/calendar?${params.toString()}`;
}

function dateLabel(day: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00.000Z`));
}

function shortDayLabel(day: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00.000Z`));
}

function monthLabel(day: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00.000Z`));
}

function eventTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function eventDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function eventHref(event: PlacementCalendarEvent) {
  if (!event.jobId) return null;

  const roundEvent=event.kind==="ROUND"||event.kind==="INTERVIEW_SLOT";
  return "/recruiter/drives/"+encodeURIComponent(event.jobId)+
    (roundEvent?"?tab=rounds"+(event.roundId?"&roundId="+encodeURIComponent(event.roundId):""):"?tab=overview");
}

function eventKindLabel(event: PlacementCalendarEvent) {
  if (event.kind === "INTERVIEW_SLOT") return "Interview slot";
  if(event.kind==="APPLICATION_DEADLINE")return "Deadline";
  return "Round";
}

function RecruiterCalendarEventCard({
  event,
}: {
  event: PlacementCalendarEvent;
}) {
  const href = eventHref(event);

  return (
    <article className="rounded-[var(--lms-radius-card)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-text">
            {event.companyName}
          </p>
          {event.collegeName ? (
            <p className="mt-1 text-xs text-muted-foreground">College: {event.collegeName}</p>
          ) : null}

          <h3 className="mt-1 text-base font-semibold text-foreground">
            {event.title}
          </h3>

          {event.jobTitle ? (
            <p className="mt-1 text-sm text-body">
              {event.jobTitle}
            </p>
          ) : null}

          <p className="mt-2 text-sm text-body">
            <time dateTime={event.startsAt.toISOString()}>
              {eventDateTime(event.startsAt)}{event.endsAt ? ` to ${eventTime(event.endsAt)}` : ""} IST
            </time>
          </p>

          {event.venue ? (
            <p className="mt-1 text-sm text-body">
              Venue: {event.venue}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            tone={
              event.kind === "APPLICATION_DEADLINE"
                ? "warning"
                : "info"
            }
          >
            {eventKindLabel(event)}
          </StatusBadge>

          <StatusBadge
            tone={
              event.status === "COMPLETED"
                ? "success"
                : "neutral"
            }
          >
            {event.status === "PROPOSED" && event.kind === "INTERVIEW_SLOT"
              ? "Waiting for the cell" : event.status.replaceAll("_", " ")}
          </StatusBadge>
        </div>
      </div>

      {href ? (
        <Link
          href={href}
          className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
        >
          Open hiring drive →
        </Link>
      ) : null}
    </article>
  );
}

export default async function HrCalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context =
    await getCurrentRequestContext();

  if (!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id) {
    redirect("/dashboard");
  }

  // eslint-disable-next-line react-hooks/purity -- calendar is anchored to current request time.
  const now = new Date();
  const today = placementCalendarDayKey(now);

  const query = await searchParams;
  if (Object.values(query).some(Array.isArray)) {
    return <div className="min-w-0 max-w-full space-y-4">
      <PageHeader eyebrow="Recruiter" title="Calendar" />
      <p role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 text-sm text-body">
        Invalid calendar filters.
      </p>
      <Link href="/hr/calendar" className="inline-flex min-h-9 items-center text-primary-text underline">
        Clear filters
      </Link>
    </div>;
  }

  const anchor = validDay(
    first(query.date),
    today,
  );

  const requestedView = first(query.view);
  const category=hrCalendarCategorySchema.safeParse(first(query.category)).data??"ALL";

  const view =
    VIEWS.find(
      (candidate) => candidate === requestedView,
    ) ?? "week";

  const window = placementCalendarWindow(
    anchor,
    view,
  );

  const calendar =
    await listRecruiterCalendarEvents(
      context,
      {
        from: window.from,
        to: window.to,
      },
    );

  const noCollegeAccess =
    (context.recruiter?.grants.length ?? 0) === 0;

  const previous = shiftCareerCalendarDay(
    anchor,
    view === "week" ? "week" : "month",
    -1,
  );

  const next = shiftCareerCalendarDay(
    anchor,
    view === "week" ? "week" : "month",
    1,
  );

  const allDays = filterHrCalendarDays(combineHrCalendarDays(calendar.days, calendar.resultsDue),category);
  const byDay = new Map(allDays.map((day) => [day.day, day]));
  const mobileDays = selectHrMobileCalendarDays(allDays, window.days);
  const eventCount = allDays.reduce((total,day)=>total+day.events.length+day.resultsDue.length,0);
  const nextVisible=hrNextCalendarEvent(calendar.events,calendar.resultsDue,category,now);

  const heading =
    view === "week"
      ? `${dateLabel(window.from)} – ${dateLabel(window.to)}`
      : monthLabel(anchor);

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        eyebrow="Recruiter"
        title="Calendar"
        description="Rounds, interview slots, deadlines and results due, for your drives at this college."
        actions={
          <Link
            href="/hr/placements"
            className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
          >
            Drives →
          </Link>
        }
      />

      {!noCollegeAccess?<div className="flex justify-end">
        <Link href={"/api/placements/recruiter/calendar/export?date="+encodeURIComponent(anchor)+"&view="+view+"&category="+category}
          className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
          Export calendar CSV
        </Link>
      </div>:null}
      {noCollegeAccess ? (
        <section className="border-b border-border pb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Open this on your college&apos;s placement address
          </h2>
          <p className="mt-2 text-sm text-body">
            Your recruiter account does not currently
            have access to any college hiring drives.
            Contact the placement cell that invited you
            to restore or approve access.
            Open this on your college&apos;s placement address to see your recruiter calendar.
          </p>

          <Link
            href="/hr/home"
            className="mt-4 inline-flex min-h-9 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
          >
            Return to Today →
          </Link>
        </section>
      ) : (
        <>
          <section
            aria-label="Recruiter calendar summary"
            className="grid overflow-hidden rounded-[var(--lms-radius-card)] border border-border sm:grid-cols-2 xl:grid-cols-5"
          >
            {[
              [
                "Hiring rounds",
                calendar.summary.rounds,
              ],
              [
                "Application deadlines",
                calendar.summary.deadlines,
              ],
              [
                "All events",
                eventCount,
              ],
              [
                "Accessible drives",
                calendar.authorizedJobCount,
              ],
              [
                "Results due",
                calendar.resultsDue.length,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="border-b border-border p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
              >
                <p className="text-xs font-semibold text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </section>

          <section className="border-b border-border pb-4 sm:pb-5">
            <h2 className="text-base font-semibold text-foreground">Results due in this period</h2>
            <p className="mt-1 text-sm text-body">Persisted round results deadlines for your employer&apos;s authorized drives. These are not interview slots or notifications.</p>
            {(category==="ALL"||category==="RESULTS_DUE")&&calendar.resultsDue.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {calendar.resultsDue.map(item => (
                <Link key={item.id} href={hrResultsDueHref(item.jobId,item.id)}
                  className="min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-muted p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
                  <span className="block break-words font-semibold text-primary-text">{item.roundName}</span>
                  <span className="mt-1 block text-sm text-body">{item.jobTitle}</span>
                  <span className="mt-2 block text-xs text-muted-foreground">Due {eventDateTime(item.dueAt)} IST · {item.status}</span>
                </Link>
              ))}
            </div> : <p className="mt-3 text-sm text-muted-foreground">No results deadlines are recorded in this calendar period.</p>}
          </section>

          <section className="border-b border-border pb-4 sm:pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Calendar controls
                </h2>
                <p className="mt-1 text-sm text-body">
                  {dateLabel(window.from)} –{" "}
                  {dateLabel(window.to)} · IST
                </p>
              </div>

              <Tabs renderPanel={false} ariaLabel="Calendar event types" value={category}
                items={HR_CALENDAR_CATEGORIES.map(option=>({value:option,
                  label:option==="ALL"?"All":option==="RESULTS_DUE"?"Results due":
                    option==="DEADLINES"?"Deadlines":option==="SLOTS"?"Interview slots":"Rounds",
                  href:calendarHref(anchor,view,option)}))}/>
              <nav
                aria-label="Calendar views"
                className="flex flex-wrap gap-3 border-b border-border"
              >
                {VIEWS.map((option) => (
                  <Link
                    key={option}
                    href={calendarHref(
                      anchor,
                      option,
                      category,
                    )}
                    aria-current={
                      view === option
                        ? "page"
                        : undefined
                    }
                    className={
                      view === option
                        ? "inline-flex min-h-9 items-center border-b-[3px] border-primary px-3 py-2 text-[13px] font-semibold capitalize text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                        : "inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] font-semibold capitalize text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                    }
                  >
                    {option}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href={calendarHref(
                  previous,
                  view,
                  category,
                )}
                aria-label={
                  view === "week"
                    ? "Previous week"
                    : "Previous month"
                }
                className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
              >
                ← Previous
              </Link>

              <Link
                href={calendarHref(today, view, category)}
                className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
              >
                Today
              </Link>

              <Link
                href={calendarHref(next, view, category)}
                aria-label={
                  view === "week"
                    ? "Next week"
                    : "Next month"
                }
                className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
              >
                Next →
              </Link>

              <span className="ml-2 text-sm font-semibold text-foreground">
                {heading}
              </span>
            </div>

            <form
              action="/hr/calendar"
              method="get"
              className="mt-5 flex flex-wrap items-end gap-3 border-t border-border pt-5"
            >
              <input
                type="hidden"
                name="view"
                value={view}
              />

              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Jump to date
                <Input
                  key={anchor}
                  type="date"
                  name="date"
                  defaultValue={anchor}
                  required
                  className="w-full"
                />
              </label>

              <Button type="submit">Go to date</Button>
            </form>
          </section>

          {nextVisible ? (
            <section className="rounded-[var(--lms-radius-card)] border border-border bg-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Next event in this period
              </p>

              <p className="mt-2 text-sm font-semibold text-foreground">
                {context.recruiter?.companyName ?? "Employer"}
                {" · "}
                {nextVisible.title}
              </p>

              <p className="mt-1 text-sm text-body">
                {eventDateTime(
                  nextVisible.at,
                )}{" "}
                IST
              </p>
            </section>
          ) : null}

          {eventCount === 0 ? (
            <section
              role="status"
              className="border-b border-border py-8 text-center"
            >
              <h2 className="text-lg font-semibold text-foreground">
                {view==="week"?"Nothing scheduled this week":"Nothing scheduled this period"}
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
                Rounds, slots and deadlines appear here as soon as they are dated.
              </p>
            </section>
          ) : null}

          {view !== "agenda" ? (
            <section
              aria-label={`${view} recruiter calendar`}
              className="rounded-[var(--lms-radius-card)] border border-border bg-surface p-3 md:overflow-x-auto"
            >
              <div className="space-y-4 md:hidden">
                {mobileDays.map((day) => (
                  <article key={day.day} className="space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-muted p-3">
                    <h3 className="text-sm font-semibold text-foreground">{dateLabel(day.day)}</h3>
                    <div className="grid gap-3">
                      {day.events.map((event) => (
                        <RecruiterCalendarEventCard key={event.id} event={event} />
                      ))}
                      {day.resultsDue.map((item) => (
                        <Link key={"due:"+item.id} href={hrResultsDueHref(item.jobId,item.id)}
                          className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
                          <strong className="block">Results due · {item.roundName}</strong>
                          <span className="mt-1 block text-body">{item.jobTitle} · {eventDateTime(item.dueAt)} IST</span>
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
                {mobileDays.length === 0 ? (
                  <p role="status" className="p-4 text-sm text-muted-foreground">
                    No rounds, deadlines or results due in this calendar period.
                  </p>
                ) : null}
              </div>
              <div className="hidden min-w-[56rem] grid-cols-7 gap-2 md:grid">
                {[
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                  "Sun",
                ].map((label) => (
                  <div
                    key={label}
                    className="py-3 text-center text-xs font-bold uppercase text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}

                {window.days.map((day) => {
                  const daily = byDay.get(day);
                  const events = daily?.events ?? [];
                  const resultsDue = daily?.resultsDue ?? [];

                  const isToday =
                    day === today;

                  const outsideMonth =
                    view === "month" &&
                    day.slice(0, 7) !==
                      anchor.slice(0, 7);

                  return (
                    <div
                      key={day}
                      aria-label={`${dateLabel(day)}: ${events.length + resultsDue.length} events`}
                      className={
                        "min-h-32 rounded-[var(--lms-control-radius)] border border-border p-2 " +
                        (outsideMonth
                          ? "bg-muted/40"
                          : "bg-muted")
                      }
                    >
                      <p
                        className={
                          isToday
                            ? "text-xs font-bold text-primary-text"
                            : "text-xs font-semibold text-foreground"
                        }
                      >
                        {shortDayLabel(day)}
                        {isToday
                          ? " · Today"
                          : ""}
                      </p>

                      <ScrollCue axis="y" label={"Calendar events for " + shortDayLabel(day)} className="mt-2" viewportClassName="max-h-52">
                        <div className="space-y-2">
                        {events.map((event) => {
                          const href =
                            eventHref(event);

                          if (!href) return null;

                          return (
                            <Link
                              key={event.id}
                              href={href}
                              title={`${eventTime(event.startsAt)} IST · ${event.companyName} · ${event.title}`}
                              className="block rounded-[var(--lms-control-radius)] bg-primary-subtle px-2 py-2 text-xs text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9"
                            >
                              <span className="block font-semibold">
                                {eventTime(
                                  event.startsAt,
                                )}
                              </span>

                              <span className="mt-1 block break-words">
                                {event.title}
                              </span>
                            </Link>
                          );
                        })}

                        {resultsDue.map((item) => (
                          <Link key={"due:" + item.id} href={hrResultsDueHref(item.jobId,item.id)}
                            title={"Results due at " + eventTime(item.dueAt) + " IST"}
                            className="block rounded-[var(--lms-control-radius)] border border-warning/40 bg-surface px-2 py-2 text-xs text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">
                            <span className="block font-semibold">Results due · {eventTime(item.dueAt)}</span>
                            <span className="mt-1 block break-words">{item.roundName}</span>
                          </Link>
                        ))}
                        {events.length === 0 && resultsDue.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        ) : null}
                        </div>
                      </ScrollCue>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {view === "agenda" ? (
            <section
              aria-label="Recruiter calendar agenda"
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Agenda
                </h2>

                <p className="mt-1 text-sm text-body">
                  {eventCount} matching
                  {" "}
                  {eventCount === 1
                    ? "event"
                    : "events"}
                  {" · "}
                  {dateLabel(window.from)}
                  {" – "}
                  {dateLabel(window.to)}
                </p>
              </div>

              {allDays.map((day) => (
                <div
                  key={day.day}
                  className="space-y-3"
                >
                  <h3 className="border-b border-border pb-2 text-sm font-semibold text-foreground">
                    {dateLabel(day.day)}
                    {day.day === today
                      ? " · Today"
                      : ""}
                  </h3>

                  <div className="grid gap-3 lg:grid-cols-2">
                    {day.events.map((event) => (
                      <RecruiterCalendarEventCard key={event.id} event={event} />
                    ))}
                    {day.resultsDue.map((item) => (
                      <article key={"due:" + item.id} className="rounded-[var(--lms-radius-card)] border border-border bg-surface p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Results due</p>
                        <h4 className="mt-2 font-semibold text-foreground">{item.roundName}</h4>
                        <p className="mt-1 text-sm text-body">{item.jobTitle} · {eventDateTime(item.dueAt)} IST</p>
                        <Link href={hrResultsDueHref(item.jobId,item.id)} className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
                          Open hiring rounds →
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
