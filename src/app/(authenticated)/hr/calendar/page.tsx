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
import Link from "next/link";
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

function fullDayLabel(day:string){
  return new Intl.DateTimeFormat("en-IN",{
    weekday:"long",day:"numeric",month:"short",timeZone:"UTC",
  }).format(new Date(day+"T12:00:00Z"));
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

function RecruiterCalendarEventCard({event}:{event:PlacementCalendarEvent}){
 const href=eventHref(event);
 const details=<div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
   <div className="min-w-0 flex-1">
     <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary-text">
       <time dateTime={event.startsAt.toISOString()}>{eventTime(event.startsAt)} IST</time>
       {event.endsAt?<span>– <time dateTime={event.endsAt.toISOString()}>{eventTime(event.endsAt)} IST</time></span>:null}
       <StatusBadge tone={event.kind==="APPLICATION_DEADLINE"?"warning":event.kind==="INTERVIEW_SLOT"?"success":"info"}>{eventKindLabel(event)}</StatusBadge>
     </div>
     <h3 className="mt-1 break-words text-sm font-semibold text-[var(--lms-heading)]">{event.title}</h3>
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
 const className="block min-w-0 rounded-[var(--lms-control-radius)] border-b border-[var(--lms-canvas-border)] px-3 py-3 transition-colors hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]";
 return href?<Link href={href} className={className} aria-label={event.title+" · "+(event.jobTitle??"")+" · Open hiring drive"}>
  {details}
 </Link>:<article className={className}>{details}</article>;
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
        action={<Link href="/recruiter/calendar" className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>}/>
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
                <Link href={calendarHref(previous,view,category,selectedCollegeId)}
                  aria-label={view==="week"?"Previous week":"Previous month"}
                  className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] min-[768px]:min-h-9">
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 8H4m4-4L4 8l4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                <Link href={calendarHref(today,view,category,selectedCollegeId)}
                  className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] min-[768px]:min-h-9">
                  This week
                </Link>
                <Link href={calendarHref(next,view,category,selectedCollegeId)}
                  aria-label={view==="week"?"Next week":"Next month"}
                  className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] min-[768px]:min-h-9">
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 8h8m-4-4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </nav>
          {selectedCollegeId ? <Link
            href={"/api/placements/recruiter/calendar/ics?from="+window.from+"&to="+window.to+"&collegeId="+encodeURIComponent(selectedCollegeId)}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle min-[768px]:min-h-9">
            Add to my calendar (.ics)
          </Link> : null}
          <Link href="/hr/placements"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-body hover:border-primary hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] min-[768px]:min-h-9 md:w-auto">
          Drives →
        </Link></div>}
      />
      {noCollegeAccess ? (
        <section className="border-b border-[var(--lms-canvas-border)] pb-6">
          <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">
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
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold min-[768px]:min-h-9 text-primary-text hover:underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            Return to Today →
          </Link>
        </section>
      ) : (
        <>
          <section className="min-w-0 space-y-4 border-b border-[var(--lms-canvas-border)] pb-4 min-[768px]:pb-6">
            <h2 className="sr-only">Calendar controls</h2>
            <div className="flex min-w-0 flex-col gap-3 min-[768px]:flex-row min-[768px]:items-end min-[768px]:justify-between">
              <div className="min-w-0">
                <p data-testid="recruiter.calendar.range" className="text-sm font-semibold text-foreground">{heading}</p>
                {view !== "week" ? <p className="mt-1 text-sm text-body">
                  {dateLabel(window.from)} – {dateLabel(window.to)} · IST
                </p> : null}
              </div>
              <Tabs renderPanel={false} ariaLabel="Calendar views" value={view}
                className="w-full min-[768px]:w-auto"
                items={VIEWS.map(option=>({value:option,label:option.charAt(0).toUpperCase()+option.slice(1),
                  href:calendarHref(anchor,option,category,selectedCollegeId)}))}/>
            </div>

            <Tabs renderPanel={false} ariaLabel="Calendar event types" value={category}
              items={HR_CALENDAR_CATEGORIES.map(option=>({value:option,
                label:option==="ALL"?"All":option==="RESULTS_DUE"?"Results due":
                  option==="DEADLINES"?"Deadlines":option==="SLOTS"?"Interview slots":"Rounds",
                href:calendarHref(anchor,view,option,selectedCollegeId)}))}/>

            <div className="flex min-w-0 flex-col gap-3 border-t border-[var(--lms-canvas-border)] pt-4 min-[1100px]:flex-row min-[1100px]:items-start min-[1100px]:justify-between">

              <div className="flex min-w-0 flex-col gap-3 min-[768px]:flex-row min-[768px]:items-start">
                <details className="min-w-0">
                  <summary className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] min-[768px]:min-h-9">
                    Jump to date
                  </summary>
                  <form action="/recruiter/calendar" method="get"
                    className="mt-3 grid min-w-0 gap-[8px] min-[768px]:grid-cols-[minmax(0,1fr)_auto] min-[768px]:items-end" aria-label="Filter recruiter calendar">
                    <Input type="hidden" name="view" value={view} />
                    {selectedCollegeId?<Input type="hidden" name="collegeId" value={selectedCollegeId}/>:null}
                    <Input type="hidden" name="category" value={category} />
                    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                      Jump to date
                      <span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span>
                      <DateInput mode="date" key={anchor} name="date" defaultValue={anchor}
                        required className="w-full" />
                    </label>
                    <Button type="submit" className="min-h-11 min-[768px]:min-h-9">Go to date</Button>
                  </form>
                </details>
                {!noCollegeAccess && grants.length<=1 ? <Link
                  href={"/api/placements/recruiter/calendar/export?date="+encodeURIComponent(anchor)+"&view="+view+"&category="+category}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] min-[768px]:min-h-9 min-[768px]:w-auto">
                  Export calendar CSV
                </Link> : null}
              </div>
            </div>
          </section>

          {nextVisible ? (
            <section aria-label="Next event in this period"
              className="flex min-w-0 flex-col gap-2 border-b border-[var(--lms-canvas-border)] py-3 min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
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
            <details className="min-w-0 border-b border-border pb-3">
              <summary className="min-h-11 cursor-pointer text-sm font-semibold text-primary-text">View month grid</summary>
              <section
              aria-label={`${view} recruiter calendar`}
              className={styles["boardFrame"]}
            >
              <div className="space-y-3 min-[1100px]:hidden">
                {mobileDays.map((day) => (
                  <article key={day.day} className={styles["mobileDay"]}>
                    <h3 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">{fullDayLabel(day.day)}{day.day===today?" · Today":""}</h3>
                    <div className={styles["mobileEvents"]}>
                      {day.events.map((event) => (
                        <RecruiterCalendarEventCard key={event.id} event={event} />
                      ))}
                      {day.resultsDue.map((item) => (
                        <Link key={"due:"+item.id} href={hrResultsDueHref(item.jobId,item.id)}
                          className="inline-flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-1 rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface p-4 text-sm text-primary-text min-[768px]:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1]">
                          <strong className="block">Results due · {item.roundName}</strong>
                          <span className="block max-w-full break-words text-body">{item.jobTitle} · {eventDateTime(item.dueAt)} IST</span>
                        </Link>
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
              <CalendarGrid className={"hidden min-[1100px]:grid "+styles["board"]}>
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
                            <Link
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
                            </Link>
                          );
                        })}

                        {resultsDue.map((item) => (
                          <Link key={"due:" + item.id} href={hrResultsDueHref(item.jobId,item.id)}
                            title={"Results due at " + eventTime(item.dueAt) + " IST"}
                            className={styles["event"]+" "+styles["due"]}>
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
              </CalendarGrid>
              </section>
            </details>
          ) : null}

          {eventCount > 0 ? (
            <section
              aria-label="Recruiter calendar agenda"
              className="space-y-6"
            >
              <div>
                <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">
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
                  <h3 className="border-b border-[var(--lms-canvas-border)] pb-2 font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">
                    {fullDayLabel(day.day)}
                    {day.day === today
                      ? " · Today"
                      : ""}
                  </h3>

                  <div className="min-w-0 divide-y divide-[var(--lms-canvas-border)]">
                    {[
                      ...day.events.map(event=>({kind:"EVENT" as const,when:event.startsAt.getTime(),event})),
                      ...day.resultsDue.map(item=>({kind:"RESULTS_DUE" as const,when:item.dueAt.getTime(),item})),
                    ].sort((left,right)=>left.when-right.when).map(entry=>
                      entry.kind==="EVENT"?
                        <RecruiterCalendarEventCard key={"event:"+entry.event.id} event={entry.event}/>:
                        <Link key={"due:"+entry.item.id}
                          href={hrResultsDueHref(entry.item.jobId,entry.item.id)}
                          className="block min-w-0 rounded-[var(--lms-control-radius)] border-b border-[var(--lms-canvas-border)] px-3 py-3 transition-colors hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Results due · {eventTime(entry.item.dueAt)} IST</p>
                          <h4 className="mt-1 font-semibold text-foreground">{entry.item.roundName}</h4>
                          <p className="mt-1 text-sm text-body">{entry.item.jobTitle}</p>
                        </Link>
                    )}
                  </div>
                </div>
              ))}
            </section>
          ) : null}
          <details className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-body min-[768px]:min-h-9">
              Recruiter calendar summary
            </summary>
            <div className="mt-3">
              <SummaryStrip label="Recruiter calendar summary" steps={[
                {label:"Hiring rounds",value:calendar.summary.rounds},
                {label:"Application deadlines",value:calendar.summary.deadlines},
                {label:"All events",value:eventCount},
                {label:"Accessible drives",value:calendar.authorizedJobCount},
                {label:"Results due",value:calendar.resultsDue.length},
              ]} />
            </div>
          </details>
        </>
      )}
    </div>
  );
}
