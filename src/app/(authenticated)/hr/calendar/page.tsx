import { DateInput } from "@/components/ui/date-input";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
import styles from "@/components/hr/recruiter-calendar-legacy.module.css";
import { Tabs } from "@/components/ui/tabs";
import { SummaryStrip } from "@/components/ui/summary-strip";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { z } from "zod";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";

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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { istTimeFormatter, istDateTimeFormatter } from "@/lib/format-date";
import { createDateFormatter } from "@/lib/format-date";

export const dynamic = "force-dynamic";

type SearchParams = {
  date?: string | string[];
  view?: string | string[];
  category?:string|string[];
  collegeId?: string | string[];
};

const VIEWS: readonly PlacementCalendarView[] = [
  "agenda",
  "week",
  "month",
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
  collegeId?: string | null,
) {
  const params = new URLSearchParams({
    date,
    view,
    category,
  });

  if (collegeId) params.set("collegeId", collegeId);
  return `/recruiter/calendar?${params.toString()}`;
}

function dateLabel(day: string) {
  return createDateFormatter("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00.000Z`));
}

function shortDayLabel(day: string) {
  return createDateFormatter("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00.000Z`));
}

function fullDayLabel(day:string){
  return createDateFormatter("en-IN", {
    weekday:"long",day:"numeric",month:"short",timeZone:"UTC",
  }).format(new Date(day+"T12:00:00Z"));
}

function monthLabel(day: string) {
  return createDateFormatter("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00.000Z`));
}

function eventTime(value: Date) {
  return istTimeFormatter.format(value);
}

function eventDateTime(value: Date) {
  return istDateTimeFormatter.format(value);
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

function RecruiterCalendarEventCard({event}:{event:PlacementCalendarEvent}){
 const href=eventHref(event);
 const details=<div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
   <div className="min-w-0 flex-1">
     <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary-text">
       <time dateTime={event.startsAt.toISOString()}>{eventTime(event.startsAt)} IST</time>
       {event.endsAt?<span>– <time dateTime={event.endsAt.toISOString()}>{eventTime(event.endsAt)} IST</time></span>:null}
       <StatusBadge tone={event.kind==="APPLICATION_DEADLINE"?"warning":event.kind==="INTERVIEW_SLOT"?"success":"info"}>{eventKindLabel(event)}</StatusBadge>
     </div>
     <Heading level={3} size="sm" className="mt-1 break-words text-[var(--lms-heading)]">{event.title}</Heading>
     <p className="mt-1 break-words text-xs text-muted-foreground">
       {[event.jobTitle,event.venue,event.note].filter(Boolean).join(" · ")||event.companyName}
     </p>
     {event.collegeName?<p className="mt-1 text-xs text-muted-foreground">{event.companyName} · College: {event.collegeName}</p>:null}
   </div>
   <div className="shrink-0 text-right">
     {event.status==="PROPOSED"&&event.kind==="INTERVIEW_SLOT"?
       <StatusBadge tone="warning">Waiting for the placement cell</StatusBadge>:
       <StatusBadge tone={event.status==="COMPLETED"?"success":event.status==="CANCELLED"?"error":"neutral"}>
        {event.status.replaceAll("_"," ")}
       </StatusBadge>}
   </div>
 </div>;
 const className="block min-w-0 rounded-[var(--lms-control-radius)] border-b border-[var(--lms-canvas-border)] px-3 py-3 transition-colors hover:bg-[var(--lms-primary-subtle)] focus-ring";
 return href?<TextLink variant="bare" href={href} className={className} aria-label={event.title+" · "+(event.jobTitle??"")+" · Open hiring drive"}>
  {details}
 </TextLink>:<article className={className}>{details}</article>;
}

/** Match the legacy foldWeek: combine slots only with a round on the same
 * day, and show orphan interview slots once per round rather than repeating. */
function foldRecruiterWeekDays(days: ReturnType<typeof combineHrCalendarDays>) {
  return days.map(day => {
    const rounds = day.events.filter(event => event.kind !== "INTERVIEW_SLOT");
    const slotsByRound = new Map<string, PlacementCalendarEvent[]>();
    for (const slot of day.events.filter(event => event.kind === "INTERVIEW_SLOT")) {
      const key = slot.jobId + ":" + (slot.roundId ?? slot.id);
      slotsByRound.set(key, [...(slotsByRound.get(key) ?? []), slot]);
    }
    const events: PlacementCalendarEvent[] = [...rounds];
    for (const slots of slotsByRound.values()) {
      const firstSlot = slots[0]!;
      const count = slots.length;
      const note = count + " interview slot" + (count === 1 ? "" : "s");
      const ownerIndex = events.findIndex(event => event.kind === "ROUND" &&
        event.jobId === firstSlot.jobId && event.roundId !== null &&
        event.roundId === firstSlot.roundId);
      if (ownerIndex >= 0) {
        events[ownerIndex] = { ...events[ownerIndex]!, note };
      } else {
        events.push({ ...firstSlot, title: "Interview slots", note });
      }
    }
    return { ...day, events: events.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()) };
  }).filter(day => day.events.length > 0 || day.resultsDue.length > 0);
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
      <PageHeader title="Calendar" />
      <ErrorState title="Invalid calendar filters" description="Review the selected date, view and event filters."
        action={<TextLink href="/recruiter/calendar" className="inline-flex min-h-11 md:min-h-9 items-center">Clear filters</TextLink>}/>
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
    ) ?? "agenda";

  // The legacy recruiter calendar defaults to the event-only agenda. A
  // selected weekly view starts Monday; other calendars keep their conventions.
  const window = view === "week" ? (() => {
    const weekday = new Date(anchor + "T12:00:00Z").getUTCDay();
    const monday = shiftCareerCalendarDay(anchor, "day", -(weekday === 0 ? 6 : weekday - 1));
    const days = Array.from({ length: 7 }, (_, index) => shiftCareerCalendarDay(monday, "day", index));
    return { from: days[0]!, to: days[6]!, days };
  })() : placementCalendarWindow(anchor, view);
  const grants = context.recruiter?.grants ?? [];
  const requestedCollegeId = first(query.collegeId);
  if (requestedCollegeId && (!z.string().uuid().safeParse(requestedCollegeId).success ||
      !grants.some(grant => grant.collegeId === requestedCollegeId))) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Calendar"/>
      <ErrorState title="College calendar unavailable"
        description="Select a college where your recruiter access is active."
        retryHref="/recruiter/calendar" retryLabel="Choose college"/>
    </div>;
  }
  if (grants.length > 1 && !requestedCollegeId) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Calendar" description="Choose the college whose drive calendar you want to view."/>
      <NeedsDoingChips label="Authorized colleges:" items={grants.map(grant => ({
        key: grant.collegeId, label: grant.collegeName,
        href: calendarHref(anchor, view, category, grant.collegeId),
      }))}/>
    </div>;
  }
  const selectedCollegeId = requestedCollegeId ?? (grants.length === 1 ? grants[0]!.collegeId : null);
  let calendar: Awaited<ReturnType<typeof listRecruiterCalendarEvents>>;
  try {
    calendar = await listRecruiterCalendarEvents(context, {
      from: window.from, to: window.to,
    }, selectedCollegeId ?? undefined);
  } catch {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Calendar"/>
      <ErrorState title="Could not load the calendar"
        description="The calendar is temporarily unavailable. Your saved rounds and interview dates have not changed."
        retryHref={calendarHref(anchor, view, category, selectedCollegeId)} retryLabel="Retry"/>
    </div>;
  }

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

  const combinedDays = combineHrCalendarDays(calendar.days, calendar.resultsDue);
  const visibleDays = view === "week" && category !== "SLOTS"
    ? foldRecruiterWeekDays(combinedDays) : combinedDays;
  const allDays = filterHrCalendarDays(visibleDays,category)
    .filter(day => day.events.length > 0 || day.resultsDue.length > 0);
  const byDay = new Map(allDays.map((day) => [day.day, day]));
  const mobileDays = selectHrMobileCalendarDays(allDays, window.days);
  const eventCount = allDays.reduce((total,day)=>total+day.events.length+day.resultsDue.length,0);
  const nextVisible=hrNextCalendarEvent(allDays.flatMap(day=>day.events),calendar.resultsDue,category,now);

  const heading =
    view === "week"
      ? `${shortDayLabel(window.from)} to ${dateLabel(window.to)}`
      : monthLabel(anchor);

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        title="Calendar"
        description="Rounds, interview slots, deadlines and results due, for your drives at this college."
        actions={<div className="flex min-w-0 flex-wrap items-center gap-3">
              <nav aria-label="Calendar period navigation" className={styles["nav"]}>
                <ButtonLink variant="secondary" href={calendarHref(previous,view,category,selectedCollegeId)}
                  aria-label={view==="week"?"Previous week":"Previous month"}
                  className="min-w-0">
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 8H4m4-4L4 8l4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </ButtonLink>
                <ButtonLink variant="secondary" href={calendarHref(today,view,category,selectedCollegeId)}
                  className="min-w-0">
                  This week
                </ButtonLink>
                <ButtonLink variant="secondary" href={calendarHref(next,view,category,selectedCollegeId)}
                  aria-label={view==="week"?"Next week":"Next month"}
                  className="min-w-0">
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 8h8m-4-4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </ButtonLink>
              </nav>
          {selectedCollegeId ? <ButtonLink variant="secondary"
            href={"/api/placements/recruiter/calendar/ics?from="+window.from+"&to="+window.to+"&collegeId="+encodeURIComponent(selectedCollegeId)}>
            Add to my calendar (.ics)
          </ButtonLink> : null}
          <ButtonLink variant="secondary" href="/hr/placements"
          className="w-full md:w-auto">
          Drives →
        </ButtonLink></div>}
      />
      {noCollegeAccess ? (
        <section className="border-b border-[var(--lms-canvas-border)] pb-6">
          <Heading level={2} className="text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] md:text-[var(--lms-font-xl)] md:leading-[28px]">
            Open this on your college&apos;s placement address
          </Heading>
          <p className="mt-2 text-sm text-body">
            Your recruiter account does not currently
            have access to any college hiring drives.
            Contact the placement cell that invited you
            to restore or approve access.
            Open this on your college&apos;s placement address to see your recruiter calendar.
          </p>

          <TextLink
            href="/hr/home"
            className="mt-4 inline-flex min-h-11 items-center text-sm md:min-h-9"
          >
            Return to Today →
          </TextLink>
        </section>
      ) : (
        <>
          <section className="min-w-0 space-y-4 border-b border-[var(--lms-canvas-border)] pb-4 md:pb-6">
            <Heading level={2} className="sr-only">Calendar controls</Heading>
            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <p data-testid="recruiter.calendar.range" className="text-sm font-semibold text-foreground">{heading}</p>
                {view !== "week" ? <p className="mt-1 text-sm text-body">
                  {dateLabel(window.from)} – {dateLabel(window.to)} · IST
                </p> : null}
              </div>
              <Tabs renderPanel={false} ariaLabel="Calendar views" value={view}
                className="w-full md:w-auto"
                items={VIEWS.map(option=>({value:option,label:option.charAt(0).toUpperCase()+option.slice(1),
                  href:calendarHref(anchor,option,category,selectedCollegeId)}))}/>
            </div>

            <Tabs renderPanel={false} ariaLabel="Calendar event types" value={category}
              items={HR_CALENDAR_CATEGORIES.map(option=>({value:option,
                label:option==="ALL"?"All":option==="RESULTS_DUE"?"Results due":
                  option==="DEADLINES"?"Deadlines":option==="SLOTS"?"Interview slots":"Rounds",
                href:calendarHref(anchor,view,option,selectedCollegeId)}))}/>

            <div className="flex min-w-0 flex-col gap-3 border-t border-[var(--lms-canvas-border)] pt-4 lg:flex-row lg:items-start lg:justify-between">

              <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start">
                <Disclosure title="Jump to date" className="min-w-0">
                  <form action="/recruiter/calendar" method="get"
                    className="mt-3 grid min-w-0 gap-[8px] md:grid-cols-[minmax(0,1fr)_auto] md:items-end" aria-label="Filter recruiter calendar">
                    <Input type="hidden" name="view" value={view} />
                    {selectedCollegeId?<Input type="hidden" name="collegeId" value={selectedCollegeId}/>:null}
                    <Input type="hidden" name="category" value={category} />
                    <Label stack className="min-w-0">
                      Jump to date
                      <span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span>
                      <DateInput mode="date" key={anchor} name="date" defaultValue={anchor}
                        required className="w-full" />
                    </Label>
                    <Button type="submit" className="min-h-11 md:min-h-9">Go to date</Button>
                  </form>
                </Disclosure>
                {!noCollegeAccess && grants.length<=1 ? <ButtonLink variant="secondary"
                  href={"/api/placements/recruiter/calendar/export?date="+encodeURIComponent(anchor)+"&view="+view+"&category="+category}
                  className="w-full md:w-auto">
                  Export calendar CSV
                </ButtonLink> : null}
              </div>
            </div>
          </section>

          {nextVisible ? (
            <section aria-label="Next event in this period"
              className="flex min-w-0 flex-col gap-2 border-b border-[var(--lms-canvas-border)] py-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Next event in this period
              </p>
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-foreground">
                  {context.recruiter?.companyName ?? "Employer"}{" · "}{nextVisible.title}
                </p>
                <p className="text-sm text-body">{eventDateTime(nextVisible.at)} IST</p>
              </div>
            </section>
          ) : null}

          {eventCount === 0 ? (
            <div data-testid="recruiter.calendar.empty">
              <EmptyState title={view==="week"?"Nothing scheduled this week":"Nothing scheduled this period"}
                description="Rounds, slots and deadlines appear here as soon as they are dated." />
            </div>
          ) : null}

          {view === "month" && eventCount > 0 ? (
            <Disclosure title="View month grid" className="min-w-0">
              <section
              aria-label={`${view} recruiter calendar`}
              className={styles["boardFrame"]}
            >
              <div className="space-y-3 lg:hidden">
                {mobileDays.map((day) => (
                  <article key={day.day} className={styles["mobileDay"]}>
                    <Heading level={3} className="text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] md:text-[var(--lms-font-lg)] md:leading-[26px]">{fullDayLabel(day.day)}{day.day===today?" · Today":""}</Heading>
                    <div className={styles["mobileEvents"]}>
                      {day.events.map((event) => (
                        <RecruiterCalendarEventCard key={event.id} event={event} />
                      ))}
                      {day.resultsDue.map((item) => (
                        <TextLink key={"due:"+item.id} href={hrResultsDueHref(item.jobId,item.id)}
                          className="inline-flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-1 rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface p-4 text-sm md:min-h-9">
                          <strong className="block">Results due · {item.roundName}</strong>
                          <span className="block max-w-full break-words text-body">{item.jobTitle} · {eventDateTime(item.dueAt)} IST</span>
                        </TextLink>
                      ))}
                    </div>
                  </article>
                ))}
                {mobileDays.length === 0 && eventCount > 0 ? (
                  <p role="status" className="p-4 text-sm text-muted-foreground leading-[1.6]">
                    No rounds, deadlines or results due in this calendar period.
                  </p>
                ) : null}
              </div>
              <CalendarGrid className={"hidden lg:grid "+styles["board"]}>
                {[
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                  "Sun",
                ].map((label,index) => (
                  <div
                    key={label}
                    className={styles["dayHead"]+" "+(index===6?calendarStyles["calendarSunday"]:"")}
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
                      data-today={isToday}
                      data-outside={outsideMonth}
                      className={styles["day"]}
                    >
                      <p
                        className={
                          (isToday
                            ? "text-xs font-bold text-primary-text"
                            : "text-xs font-semibold text-foreground") +
                          (!isToday && new Date(day+"T12:00:00Z").getUTCDay()===0?" "+calendarStyles["calendarSunday"]:"")
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
                            <TextLink variant="bare"
                              key={event.id}
                              href={href}
                              title={`${eventTime(event.startsAt)} IST · ${event.companyName} · ${event.title}`}
                              className={styles["event"]}
                            >
                              <span className={styles["time"]+" block font-semibold"}>
                                {eventTime(
                                  event.startsAt,
                                )}
                              </span>

                              <span className="mt-1 block break-words">
                                {event.title}
                              </span>
                            </TextLink>
                          );
                        })}

                        {resultsDue.map((item) => (
                          <TextLink variant="bare" key={"due:" + item.id} href={hrResultsDueHref(item.jobId,item.id)}
                            title={"Results due at " + eventTime(item.dueAt) + " IST"}
                            className={styles["event"]+" "+styles["due"]}>
                            <span className="block font-semibold">Results due · {eventTime(item.dueAt)}</span>
                            <span className="mt-1 block break-words">{item.roundName}</span>
                          </TextLink>
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
              </CalendarGrid>
              </section>
            </Disclosure>
          ) : null}

          {eventCount > 0 ? (
            <section
              aria-label="Recruiter calendar agenda"
              className="space-y-6"
            >
              <div>
                <Heading level={2} className="text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] md:text-[var(--lms-font-xl)] md:leading-[28px]">
                  Agenda
                </Heading>

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
                  <Heading level={3} className="border-b border-[var(--lms-canvas-border)] pb-2 text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] md:text-[var(--lms-font-lg)] md:leading-[26px]">
                    {fullDayLabel(day.day)}
                    {day.day === today
                      ? " · Today"
                      : ""}
                  </Heading>

                  <div className="min-w-0 divide-y divide-[var(--lms-canvas-border)]">
                    {[
                      ...day.events.map(event=>({kind:"EVENT" as const,when:event.startsAt.getTime(),event})),
                      ...day.resultsDue.map(item=>({kind:"RESULTS_DUE" as const,when:item.dueAt.getTime(),item})),
                    ].sort((left,right)=>left.when-right.when).map(entry=>
                      entry.kind==="EVENT"?
                        <RecruiterCalendarEventCard key={"event:"+entry.event.id} event={entry.event}/>:
                        <ButtonLink variant="secondary" key={"due:"+entry.item.id}
                          href={hrResultsDueHref(entry.item.jobId,entry.item.id)}
                          className="block min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Results due · {eventTime(entry.item.dueAt)} IST</p>
                          <Heading level={4} className="mt-1 text-foreground">{entry.item.roundName}</Heading>
                          <p className="mt-1 text-sm text-body">{entry.item.jobTitle}</p>
                        </ButtonLink>
                    )}
                  </div>
                </div>
              ))}
            </section>
          ) : null}
          <Disclosure title="Recruiter calendar summary" className="min-w-0">
            <div className="mt-3">
              <SummaryStrip label="Recruiter calendar summary" steps={[
                {label:"Hiring rounds",value:calendar.summary.rounds},
                {label:"Application deadlines",value:calendar.summary.deadlines},
                {label:"All events",value:eventCount},
                {label:"Accessible drives",value:calendar.authorizedJobCount},
                {label:"Results due",value:calendar.resultsDue.length},
              ]} />
            </div>
          </Disclosure>
        </>
      )}
    </div>
  );
}
