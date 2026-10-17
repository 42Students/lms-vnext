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
    <article className="rounded-xl border border-border bg-surface p-4">
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
          className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline"
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

  if (!hasActiveRecruiter(context)) {
    redirect("/dashboard");
  }

  // eslint-disable-next-line react-hooks/purity -- calendar is anchored to current request time.
  const now = new Date();
  const today = placementCalendarDayKey(now);

  const query = await searchParams;

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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Recruiter"
        title="Calendar"
        description="Rounds, interview slots, deadlines and results due, for your drives at this college."
        actions={
          <Link
            href="/hr/placements"
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
          >
            Drives →
          </Link>
        }
      />

      {!noCollegeAccess?<div className="flex justify-end">
        <Link href={"/api/placements/recruiter/calendar/export?date="+encodeURIComponent(anchor)+"&view="+view+"&category="+category}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-primary-text">
          Export calendar CSV
        </Link>
      </div>:null}
      {noCollegeAccess ? (
        <section className="rounded-xl border border-border bg-surface p-6">
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
            className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline"
          >
            Return to Today →
          </Link>
        </section>
      ) : (
        <>
          <section
            aria-label="Recruiter calendar summary"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
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
                className="rounded-xl border border-border bg-surface p-4"
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

          <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground">Results due in this period</h2>
            <p className="mt-1 text-sm text-body">Persisted round results deadlines for your employer&apos;s authorized drives. These are not interview slots or notifications.</p>
            {(category==="ALL"||category==="RESULTS_DUE")&&calendar.resultsDue.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {calendar.resultsDue.map(item => (
                <Link key={item.id} href={hrResultsDueHref(item.jobId,item.id)}
                  className="min-w-0 rounded-lg border border-border bg-surface-secondary p-4 hover:border-primary">
                  <span className="block break-words font-semibold text-primary-text">{item.roundName}</span>
                  <span className="mt-1 block text-sm text-body">{item.jobTitle}</span>
                  <span className="mt-2 block text-xs text-muted-foreground">Due {eventDateTime(item.dueAt)} IST · {item.status}</span>
                </Link>
              ))}
            </div> : <p className="mt-3 text-sm text-muted-foreground">No results deadlines are recorded in this calendar period.</p>}
          </section>

          <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
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

              <nav aria-label="Calendar event types" className="flex flex-wrap gap-2">
                {HR_CALENDAR_CATEGORIES.map(option=><Link key={option}
                  href={calendarHref(anchor,view,option)}
                  aria-current={category===option?"page":undefined}
                  className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">
                  {option==="ALL"?"All":option==="RESULTS_DUE"?"Results due":
                    option==="DEADLINES"?"Deadlines":option==="SLOTS"?"Interview slots":"Rounds"}
                </Link>)}
              </nav>
              <nav
                aria-label="Calendar views"
                className="flex flex-wrap gap-2"
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
                        ? "inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold capitalize text-on-primary"
                        : "inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold capitalize text-body hover:text-primary-text"
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
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                ← Previous
              </Link>

              <Link
                href={calendarHref(today, view, category)}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
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
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
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
                <input
                  key={anchor}
                  type="date"
                  name="date"
                  defaultValue={anchor}
                  required
                  className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
                />
              </label>

              <button
                type="submit"
                className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
              >
                Go to date
              </button>
            </form>
          </section>

          {nextVisible ? (
            <section className="rounded-xl border border-border bg-surface-secondary p-4">
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
              className="rounded-xl border border-border bg-surface p-8 text-center"
            >
              <h2 className="text-lg font-semibold text-foreground">
                Nothing scheduled in this period
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
                No matching authorized events are recorded in this period for the selected category. Try another week, month, or event type.
              </p>
            </section>
          ) : null}

          {view !== "agenda" ? (
            <section
              aria-label={`${view} recruiter calendar`}
              className="rounded-xl border border-border bg-surface p-3 md:overflow-x-auto"
            >
              <div className="space-y-4 md:hidden">
                {mobileDays.map((day) => (
                  <article key={day.day} className="space-y-3 rounded-lg border border-border bg-surface-secondary p-3">
                    <h3 className="text-sm font-semibold text-foreground">{dateLabel(day.day)}</h3>
                    <div className="grid gap-3">
                      {day.events.map((event) => (
                        <RecruiterCalendarEventCard key={event.id} event={event} />
                      ))}
                      {day.resultsDue.map((item) => (
                        <Link key={"due:"+item.id} href={hrResultsDueHref(item.jobId,item.id)}
                          className="rounded-md border border-border bg-surface p-4 text-sm text-primary-text">
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
                        "min-h-32 rounded-lg border border-border p-2 " +
                        (outsideMonth
                          ? "bg-muted/40"
                          : "bg-surface-secondary")
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

                      <div className="mt-2 max-h-52 space-y-2 overflow-y-auto">
                        {events.map((event) => {
                          const href =
                            eventHref(event);

                          if (!href) return null;

                          return (
                            <Link
                              key={event.id}
                              href={href}
                              title={`${eventTime(event.startsAt)} IST · ${event.companyName} · ${event.title}`}
                              className="block rounded-md bg-primary-subtle px-2 py-2 text-xs text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
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
                            className="block rounded-md border border-warning/40 bg-surface px-2 py-2 text-xs text-foreground hover:underline">
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
                      <article key={"due:" + item.id} className="rounded-xl border border-border bg-surface p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Results due</p>
                        <h4 className="mt-2 font-semibold text-foreground">{item.roundName}</h4>
                        <p className="mt-1 text-sm text-body">{item.jobTitle} · {eventDateTime(item.dueAt)} IST</p>
                        <Link href={hrResultsDueHref(item.jobId,item.id)} className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">
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
