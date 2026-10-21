import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import calendarStyles from "./legacy-calendar-theme.module.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {TpoCalendarMoveFollowup} from "@/components/placements/tpo-calendar-followup-actions";
import {TpoNewFollowupModal} from "@/components/tpo/tpo-new-followup-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { FilterChipLink } from "@/components/ui/filter-chip";
import { SuperAdminInterviewOperations } from "@/components/admin/super-admin-interview-operations";
import { listSuperAdminBookedInterviews } from "@/modules/placements/super-admin-booked-interviews-service";
import { PlacementPanelErrorBoundary } from "@/components/admin/placement-panel-error-boundary";

import { parseActivityDateBoundary } from "@/modules/activity/date-boundary";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";

import {
  initialCareerCalendarDay,
  shiftCareerCalendarDay,
} from "@/modules/placements/learner-career-calendar-model";

import {
  groupPlacementCalendarEvents,
  placementCalendarDayKey,
  placementCalendarWindow,
  summarizePlacementCalendar,
  type PlacementCalendarEvent,
  type PlacementCalendarKind,
  type PlacementCalendarView,
} from "@/modules/placements/placement-calendar-model";

import { listPlacementCalendarEvents } from "@/modules/placements/placement-calendar-service";
import {getTpoBlockedDates} from "@/modules/placements/tpo-configuration-read-service";
import {tpoCrmTablesReady} from "@/modules/placements/tpo-crm-storage-readiness";
import {toTpoBlockedCalendarEvents} from "@/modules/placements/tpo-blocked-calendar-model";
import {summarizeTpoCalendarNeeds} from "@/modules/placements/tpo-calendar-needs-model";
import {tpoLegacyCalendarEventTitle,TPO_CALENDAR_SUBTITLE,TPO_EMPTY_AGENDA} from "@/modules/placements/tpo-calendar-display-model";
import { calendarDueAtToIstLocal } from "@/modules/placements/tpo-calendar-followup-model";
import { placementRoundKinds } from "@/modules/placements/validation";
import { TPO_CALENDAR_CHIP_CHOICES, filterTpoCalendarChipEvents, parseTpoCalendarChips, toggleTpoCalendarChip, tpoCalendarChipCount, type TpoCalendarChip } from "@/modules/placements/tpo-calendar-kind-chips";

type CalendarAudience = "TPO" | "COLLEGE_ADMIN" | "SUPER_ADMIN";

/**
 * Last-known TPO follow-up summary, scoped to the requesting principal and
 * college. Retains a bounded, short-lived view when an independently loaded
 * calendar source fails on refresh; never treats an outage as zero events.
 * Process-local retention is best-effort, not a durable calendar store.
 */
const lastKnownTpoNeeds = new Map<string, {
  savedAt: number;
  events: PlacementCalendarEvent[];
}>();

function keepTpoNeedsSummary(
  userId: string,
  collegeId: string,
  events: PlacementCalendarEvent[] | null,
  now: Date,
): { events: PlacementCalendarEvent[]; stale: boolean } {
  const key = userId + ":" + collegeId;
  if (events !== null) {
    if (lastKnownTpoNeeds.size >= 200) lastKnownTpoNeeds.clear();
    lastKnownTpoNeeds.set(key, { savedAt: now.getTime(), events });
    return { events, stale: false };
  }
  const last = lastKnownTpoNeeds.get(key);
  if (last && now.getTime() - last.savedAt <= 15 * 60_000) {
    return { events: last.events, stale: true };
  }
  if (last) lastKnownTpoNeeds.delete(key);
  return { events: [], stale: false };
}


type CalendarSearchParams = {
  date?: string | string[];
  view?: string | string[];
  company?: string | string[];
  kind?: string | string[];
  kinds?: string | string[];
  roundKind?: string | string[];
  job?: string | string[];
  jobId?: string | string[];
  focus?: string | string[];
};

type CalendarState = {
  anchor: string;
  view: PlacementCalendarView;
  company: string;
  kind: PlacementCalendarKind | undefined;
  kinds: TpoCalendarChip[];
  roundKind: (typeof placementRoundKinds)[number] | undefined;
  job: string;
  jobId: string;
  focus: "OVERDUE" | "BLOCKED" | "BUSY" | null;
};

const VIEWS: readonly PlacementCalendarView[] = [
  "week",
  "month",
  "agenda",
];

const EVENT_FILTERS: ReadonlyArray<{
  value: PlacementCalendarKind | "";
  label: string;
}> = [
  { value: "", label: "All events" },
  { value: "BLOCKED", label: "Blocked (exam) dates" },
  { value: "ROUND", label: "Rounds and talks" },
  {
    value: "APPLICATION_DEADLINE",
    label: "Application deadlines",
  },
  {
    value: "FOLLOW_UP",
    label: "Recruiter follow-ups",
  },
];

const ROUND_FILTERS: ReadonlyArray<{
  value: (typeof placementRoundKinds)[number] | "";
  label: string;
}> = [
  { value: "", label: "All rounds" },
  { value: "INTERVIEW", label: "Interviews" },
  { value: "GD", label: "Group discussions" },
  { value: "TALK", label: "Talks" },
  { value: "TEST", label: "Tests" },
  { value: "VENDOR_TEST", label: "Vendor tests" },
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
): string {
  if (!value) return fallback;

  try {
    parseActivityDateBoundary(value, "from");
    return value;
  } catch {
    return fallback;
  }
}

function normalizedState(
  searchParams: CalendarSearchParams,
  audience: CalendarAudience,
  today: string,
): CalendarState {
  const requestedView = first(searchParams.view);

  const view: PlacementCalendarView =
    VIEWS.find((candidate) => candidate === requestedView) ??
    "month";

  const requestedKind = first(searchParams.kind);

  const kind =
    EVENT_FILTERS.find(
      (option) =>
        option.value !== "" &&
        option.value === requestedKind,
    )?.value || undefined;

  const requestedRoundKind = first(
    searchParams.roundKind,
  );

  const roundKind =
    audience !== "TPO"
      ? requestedRoundKind === ""
        ? undefined
        : placementRoundKinds.find(
            (candidate) =>
              candidate === requestedRoundKind,
          ) ?? "INTERVIEW"
      : undefined;

  return {
    anchor: validDay(
      first(searchParams.date),
      today,
    ),
    view,
    company:
      first(searchParams.company)
        ?.trim()
        .slice(0, 150) ?? "",
    kind:
      audience === "TPO"
        ? kind
        : "ROUND",
    kinds: audience === "TPO" ? parseTpoCalendarChips(first(searchParams.kinds)) : [],
    roundKind,
    job:
      audience !== "TPO"
        ? first(searchParams.job)
            ?.trim()
            .slice(0, 150) ?? ""
        : "",
    jobId: audience !== "TPO" && /^[a-f0-9-]{36}$/i.test(first(searchParams.jobId) ?? "")
      ? first(searchParams.jobId)! : "",
    focus: audience === "TPO" && ["OVERDUE","BLOCKED","BUSY"].includes(first(searchParams.focus) ?? "")
      ? first(searchParams.focus) as "OVERDUE" | "BLOCKED" | "BUSY"
      : null,
  };
}

function calendarHref(
  basePath: string,
  audience: CalendarAudience,
  state: CalendarState,
  overrides: Partial<
    Pick<CalendarState, "anchor" | "view" | "kind" | "kinds" | "company" | "focus" | "jobId">
  > = {},
): string {
  const params = new URLSearchParams();

  params.set(
    "date",
    overrides.anchor ?? state.anchor,
  );

  params.set(
    "view",
    overrides.view ?? state.view,
  );

  const company="company" in overrides?overrides.company:state.company;
  if(company)params.set("company",company);

  if (audience === "TPO") {
    const focus = "focus" in overrides ? overrides.focus : state.focus;
    if (focus) params.set("focus", focus);
    const requestedKind="kind" in overrides?overrides.kind:state.kind;
    const selectedKinds = "kinds" in overrides ? overrides.kinds : state.kinds;
    if (selectedKinds?.length) params.set("kinds", selectedKinds.join(","));
    else if (requestedKind && !("kinds" in overrides)) params.set("kind", requestedKind);
  } else {
    params.set(
      "roundKind",
      state.roundKind ?? "",
    );

    if (state.job) {
      params.set("job", state.job);
    }
    const selectedJobId = "jobId" in overrides ? overrides.jobId : state.jobId;
    if (selectedJobId) params.set("jobId", selectedJobId);
  }

  return `${basePath}?${params.toString()}`;
}

function eventHref(
  event: PlacementCalendarEvent,
  audience: CalendarAudience,
): string | null {
  if (event.jobId) {
    const base =
      audience === "TPO"
        ? "/tpo/placements/jobs/"
        : audience === "SUPER_ADMIN"
          ? "/admin/placements/jobs/"
          : "/college/placements/jobs/";

    const jobHref =
      base + encodeURIComponent(event.jobId);
    if (audience === "COLLEGE_ADMIN" && event.kind === "INTERVIEW_SLOT" && event.applicationId) {
      return jobHref + "/applications?applicationId=" + encodeURIComponent(event.applicationId);
    }

    return event.roundId
      ? audience === "TPO"
        ? `${jobHref}/rounds/${encodeURIComponent(event.roundId)}/results`
        : `${jobHref}#round-${encodeURIComponent(event.roundId)}`
      : jobHref;
  }

  if (
    audience === "TPO" &&
    event.leadId
  ) {
    return (
      "/tpo/recruiters/" +
      encodeURIComponent(event.leadId)
    );
  }

  return null;
}

function dayLabel(day: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    weekday: "short",
    timeZone: "UTC",
  }).format(
    new Date(`${day}T12:00:00.000Z`),
  );
}

function dateLabel(day: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(`${day}T12:00:00.000Z`),
  );
}

function monthLabel(day: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(`${day}T12:00:00.000Z`),
  );
}

function eventTime(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function eventDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function eventTypeLabel(
  event: PlacementCalendarEvent,
): string {
  if (event.kind === "BLOCKED") return "Blocked";
  if (event.kind === "APPLICATION_DEADLINE") {
    return "Deadline";
  }

  if (event.kind === "FOLLOW_UP") {
    return "Follow-up";
  }

  return event.roundKind
    ? event.roundKind.replaceAll("_", " ")
    : "Round";
}

function eventTone(
  event: PlacementCalendarEvent,
): "neutral" | "info" | "success" | "warning" {
  if (event.kind === "BLOCKED") return "neutral";
  if (
    event.status === "DONE" ||
    event.status === "COMPLETED"
  ) {
    return "success";
  }

  if (
    event.kind === "APPLICATION_DEADLINE"
  ) {
    return "warning";
  }

  return "info";
}

function CalendarEventCard({
  event,
  audience,
  allowFollowupEditing,
}: {
  event: PlacementCalendarEvent;
  audience: CalendarAudience;
  allowFollowupEditing: boolean;
}) {
  const href = eventHref(event, audience);

  return (
    <article className="min-w-0 py-[var(--lms-space-4)]">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 break-words text-xs font-semibold text-[var(--lms-muted-text)]">
            {event.companyName}
          </p>
          <h3 className="mt-[var(--lms-space-1)] break-words text-base font-semibold text-[var(--lms-heading)]">
            {event.title}
          </h3>
          {event.jobTitle ? (
            <p className="mt-1 text-sm text-body">
              {event.jobTitle}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-body">
            <time dateTime={event.startsAt.toISOString()}>
              {eventDateTime(event.startsAt)} IST
            </time>
          </p>
          {event.venue ? (
            <p className="mt-1 text-sm text-body">
              Venue: {event.venue}
            </p>
          ) : null}
          {event.note ? (
            <p className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm text-body">
              {event.note}
            </p>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <StatusBadge tone={eventTone(event)}>
            {eventTypeLabel(event)}
          </StatusBadge>
          <StatusBadge
            tone={
              event.status === "DONE" ||
              event.status === "COMPLETED"
                ? "success"
                : "neutral"
            }
          >
            {event.status.replaceAll("_", " ")}
          </StatusBadge>
        </div>
      </div>
      {href ? (
        <Link
          href={href}
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]"
        >
          {event.leadId
            ? "Open recruiter lead"
            : event.roundId
              ? "Open round in job"
              : "Open placement job"}{" "}
          →
        </Link>
      ) : null}
      {audience === "TPO" && allowFollowupEditing &&
       event.kind === "FOLLOW_UP" && event.status === "OPEN" &&
       event.followupId ? (
        <TpoCalendarMoveFollowup
          followupId={event.followupId}
          currentIst={calendarDueAtToIstLocal(event.startsAt)}
        />
      ) : null}
    </article>
  );
}

export async function PlacementCalendarWorkspace({
  context,
  collegeId,
  audience,
  searchParams,
}: {
  context: RequestContext;
  collegeId: string;
  audience: CalendarAudience;
  searchParams: CalendarSearchParams;
}) {
  const now = new Date();
  const today = placementCalendarDayKey(now);
  const state = normalizedState(
    searchParams,
    audience,
    today || initialCareerCalendarDay(),
  );

  const basePath =
    audience === "TPO"
      ? "/tpo/calendar"
      : audience === "SUPER_ADMIN"
        ? "/admin/placements/calendar"
        : "/college/placements/calendar";

  const window = placementCalendarWindow(
    state.anchor,
    state.view,
  );

  // A single failed event source must not take down the interview calendar,
  // its independently loaded appointment directory, or TPO needs-doing.
  // Never label missing data as a legitimate zero.
  const loadedResponse =
    await listPlacementCalendarEvents(
      context,
      {
        collegeId,
        from: window.from,
        to: window.to,
        company: state.company || undefined,
        kind: audience === "TPO" && state.kinds.length ? undefined : state.kind,
        roundKind: state.roundKind,
        tpoLegacyScope:audience==="TPO",
      },
    ).catch((error: unknown) => {
      // Permission failures must remain permission failures; only an
      // unavailable calendar data source receives an inline Retry state.
      if (error instanceof AuthorizationError) throw error;
      return null;
    });
  const response = loadedResponse ?? {
    from: window.from, to: window.to,
    events: [], days: [], summary: summarizePlacementCalendar([], now),
  };

  const bookings=audience==="SUPER_ADMIN"?await listSuperAdminBookedInterviews(context,window.from,window.to)
    .then(value=>({...value,failed:false})).catch(()=>({events:[],truncated:false,failed:true})):null;
  const eventTypeCountsSource=audience==="TPO"&&(state.kind||state.company||state.kinds.length)
   ?await listPlacementCalendarEvents(context,{
    collegeId,from:window.from,to:window.to,tpoLegacyScope:true,
   }).catch(()=>null)
   :loadedResponse;
  const countSourceEvents=eventTypeCountsSource?.events??[];
  const eventTypeCounts=new Map<string,number>();
  for(const item of countSourceEvents)
   eventTypeCounts.set(item.kind,(eventTypeCounts.get(item.kind)??0)+1);

  // The shared read service supports event-kind and
  // company filtering. The College Admin and Super Admin
  // job-name filter is a view-level refinement of
  // already authorized rows.
  const events =
    audience !== "TPO" && (state.job || state.jobId)
      ? response.events.filter((event) =>
          (!state.jobId || event.jobId === state.jobId) &&
          (!state.job || Boolean(event.jobTitle
            ?.toLocaleLowerCase("en-IN")
            .includes(state.job.toLocaleLowerCase("en-IN")))),
        )
      : response.events;

  const audienceEvents=audience==="TPO"?events.map(event=>({...event,title:tpoLegacyCalendarEventTitle(event)})):events;
  const needsWindow=audience==="TPO"?await listPlacementCalendarEvents(context,{
    collegeId,
    from:placementCalendarDayKey(new Date(now.getTime()-90*86400000)),
    to:placementCalendarDayKey(new Date(now.getTime()+7*86400000)),
    tpoLegacyScope:true,
  }).catch(()=>null):null;
  const blockedDays=audience==="TPO"?await getTpoBlockedDates(context).catch(()=>null):null;
  const partialCalendar=!loadedResponse ||
    (audience==="TPO"&&(!needsWindow||!eventTypeCountsSource||!blockedDays?.ready));
  const blockedEvents=audience==="TPO"&&blockedDays?.ready&&(state.kinds.length ? state.kinds.includes("BLOCKED") : (!state.kind||state.kind==="BLOCKED"))?
    toTpoBlockedCalendarEvents(blockedDays.rows,window.from,window.to):[];
  const selectedEvents=state.kind==="BLOCKED" && !state.kinds.length ? blockedEvents : [...audienceEvents,...blockedEvents];
  const visibleEvents=audience==="TPO" && state.kinds.length ? filterTpoCalendarChipEvents(selectedEvents,state.kinds) : selectedEvents;
  if(audience==="TPO"&&blockedDays?.ready)
   eventTypeCounts.set("BLOCKED",toTpoBlockedCalendarEvents(blockedDays.rows,window.from,window.to).length);
  const needsSnapshot = keepTpoNeedsSummary(
    context.user.id, collegeId, needsWindow?.events ?? null, now,
  );
  const needsEvents = needsSnapshot.events;
  const needsKnown = needsWindow !== null || needsSnapshot.stale;
  const blockedSet=new Set(blockedDays?.rows.map(item=>item.day)??[]);
  const {overdue,blockedRounds,busyDays}=summarizeTpoCalendarNeeds(needsEvents,blockedSet,now);
  const groups =
    groupPlacementCalendarEvents(visibleEvents);

  const byDay = new Map(
    groups.map((group) => [
      group.day,
      group.events,
    ]),
  );

  const summary =
    summarizePlacementCalendar(
      visibleEvents,
      now,
    );

  const previous =
    shiftCareerCalendarDay(
      state.anchor,
      state.view === "week"
        ? "week"
        : "month",
      -1,
    );

  const next =
    shiftCareerCalendarDay(
      state.anchor,
      state.view === "week"
        ? "week"
        : "month",
      1,
    );

  const todayEvents=needsEvents.filter(event=>placementCalendarDayKey(event.startsAt)===today)
   .sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime());
  const sevenDayEnd=placementCalendarDayKey(new Date(now.getTime()+7*24*60*60*1000));
  const nextSeven=needsEvents.filter(event=>event.startsAt>=now &&
   placementCalendarDayKey(event.startsAt)<=sevenDayEnd);
  const isTpo = audience === "TPO";
  // The follow-up POST/PATCH APIs use this exact persisted-table readiness
  // check, not a deployment string. Never show editing against absent DB09.
  const calendarFollowupsWritable =
    isTpo && await tpoCrmTablesReady().catch(() => false);
  const focusedNeeds = state.focus === "OVERDUE" ? overdue :
    state.focus === "BLOCKED" ? blockedRounds :
    state.focus === "BUSY"
      ? needsEvents.filter(event => busyDays.some(([day]) =>
          day === placementCalendarDayKey(event.startsAt)))
      : [];
  const partialSummarySources = [
    !loadedResponse ? "calendar events" : null,
    isTpo && !needsWindow ? "today/next 7 days and overdue follow-ups" : null,
    isTpo && !eventTypeCountsSource ? "event-type counts" : null,
    isTpo && !blockedDays?.ready ? "blocked dates and conflicts" : null,
  ].filter((value): value is string => value !== null);
  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader
        title={
          isTpo
            ? TPO_OWNER_PAGE_COPY.calendar
            : audience === "SUPER_ADMIN" ? "Interviews" : "Placement Interview Calendar"
        }
        description={
          isTpo
            ? TPO_CALENDAR_SUBTITLE
            : audience === "SUPER_ADMIN"
              ? "Review the interview schedule, conflicts and candidate context without leaving the placements workspace."
              : "Interview rounds and other employer events across your college, with company and job filters. Dates and times are shown in Indian Standard Time."
        }
        actions={
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {audience === "COLLEGE_ADMIN" ? (
              <Link href="/college/placements/interviews"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:border-primary hover:text-[var(--lms-link-text)] md:min-h-9">
                View interviews
              </Link>
            ) : null}
            <Link
              href={
                isTpo
                  ? "/tpo/placements"
                  : audience === "SUPER_ADMIN"
                    ? "/admin/placements"
                    : "/college/placements"
              }
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:border-primary hover:text-[var(--lms-link-text)] md:min-h-9"
            >
              Placement operations →
            </Link>
          </div>
        }
      />

      {partialCalendar?<Banner tone="warning" role="alert" action={<Link href={calendarHref(basePath,audience,state,{})} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 font-semibold text-primary-text md:min-h-9">Retry</Link>}>
        <p className="font-semibold text-warning-text">Could not refresh {partialSummarySources.join(", ")}. {needsSnapshot.stale ? "Showing the last successful follow-up summary (up to 15 minutes old)." : loadedResponse ? "The successful events remain visible." : "Calendar events are unavailable; other successful sources remain visible."} Missing counts are not zero. Retry summary.</p>
      </Banner>:null}

      {calendarFollowupsWritable ? (
        <div className="inline-flex border-b border-border pb-2">
         <TpoNewFollowupModal collegeId={collegeId}/>
        </div>
      ) : isTpo ? (
        <Banner tone="warning" role="alert"
          action={<Link href={calendarHref(basePath,audience,state,{})}
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 font-semibold text-primary-text md:min-h-9">Retry</Link>}>
          Follow-up editing is unavailable because DB09 recruiter CRM storage could not be verified.
          Ask your administrator to apply the DB09 CRM migration. Existing calendar events are read-only.
        </Banner>
      ) : null}

      {isTpo?<section aria-label="Today and next 7 days" className="border-b border-border pb-4">
       <h2 className="text-base font-semibold">Today</h2>
       {needsKnown?todayEvents.length?<ul className="mt-2 space-y-2">{todayEvents.map(event=><li key={event.id} className="text-sm text-body">
         <span className="font-semibold">{eventTime(event.startsAt)}</span>{" · "}{event.title}
         {event.status==="DONE"?<span className="ml-2 text-success-text">Done</span>:null}
        </li>)}</ul>:<p className="mt-2 text-sm text-body">Nothing scheduled today</p>:
         <p role="status" className="mt-2 text-sm text-warning-text">Today&apos;s schedule is unavailable.</p>}
       {needsKnown?<p className="mt-3 text-sm text-body">Next 7 days · {nextSeven.length} scheduled event{nextSeven.length===1?"":"s"}</p>:null}
      </section>:null}
      {isTpo?<section aria-label="Needs doing" className="space-y-3 border-b border-border pb-4">
       <h2 className="text-base font-semibold">Needs doing</h2>
       <div className="grid min-w-0 gap-0 divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
        {([
          {focus:"OVERDUE" as const,label:"Follow-ups overdue (last 90 days)",value:needsKnown?overdue.length:null},
          {focus:"BLOCKED" as const,label:"Rounds on a blocked date",value:needsKnown&&blockedDays?.ready?blockedRounds.length:null},
          {focus:"BUSY" as const,label:"Busy days (3 or more)",value:needsKnown?busyDays.length:null},
        ]).map(item=><Link key={item.focus}
          href={calendarHref(basePath,audience,state,{focus:state.focus===item.focus?null:item.focus})}
          aria-current={state.focus===item.focus?"true":undefined}
          className="flex min-h-11 min-w-0 flex-col justify-center gap-1 p-3 text-sm text-[var(--lms-link-text)] hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          <strong className="block text-lg">{item.value===null?"Unavailable":item.value}</strong>
          {item.label}{state.focus===item.focus?" · Selected":""}
        </Link>)}
       </div>
       {state.focus ? <div className="border-b border-border py-3" aria-label="Needs doing details">
         <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
           {state.focus==="OVERDUE"?"Overdue follow-ups":state.focus==="BLOCKED"?"Rounds on blocked dates":"Busy day events"}
          </h3>
          <Link href={calendarHref(basePath,audience,state,{focus:null})}
           className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
           Close
          </Link>
         </div>
         {!needsKnown || (state.focus==="BLOCKED"&&!blockedDays?.ready)
          ? <p role="status" className="mt-2 text-sm text-warning-text">This list is unavailable. Retry the calendar summary.</p>
          : focusedNeeds.length===0
            ? <p className="mt-2 text-sm text-body">Nothing needs attention in this category.</p>
            : <div className="divide-y divide-border">
              {focusedNeeds.slice(0,15).map(event=><CalendarEventCard key={event.id}
                event={event} audience="TPO" allowFollowupEditing={calendarFollowupsWritable}/>)}
              {focusedNeeds.length>15?<p className="py-2 text-xs text-muted-foreground">
                Showing 15 of {focusedNeeds.length} events. Choose the relevant calendar week to view more.
              </p>:null}
             </div>}
        </div> : null}
       {!blockedDays?.ready?<p role="status" className="text-xs text-warning-text">
        Blocked-day storage is unavailable; conflict counts cannot be verified.</p>:null}
      </section>:null}
      <section
        aria-label="Calendar summary"
        className="grid min-w-0 grid-cols-2 overflow-hidden border border-border xl:grid-cols-4"
      >
        {(
          isTpo
            ? [
                ["Rounds", summary.rounds],
                ["Deadlines", summary.deadlines],
                ["Follow-ups", summary.followups],
                ["All events", summary.total],
              ]
            : [
                ["College rounds", summary.rounds],
                ["Matching events", summary.total],
              ]
        ).map(([label, count]) => (
          <div
            key={String(label)}
            className="min-w-0 border-b border-r border-border px-3 py-3 even:border-r-0 xl:border-b-0 xl:even:border-r xl:last:border-r-0"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {loadedResponse ? count : "Unavailable"}
            </p>
          </div>
        ))}
      </section>

      {/* Preserve the legacy interviews-first entry point. The graphical
          calendar remains an optional companion below the appointment list. */}
      {audience==="SUPER_ADMIN" ? <PlacementPanelErrorBoundary>
        {bookings?.failed ? <Banner tone="error" action={<Link href={calendarHref(basePath,audience,state,{})}
           className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Retry interviews</Link>}>
          Could not load candidate interviews right now. The calendar is still available.
        </Banner> : <SuperAdminInterviewOperations today={today} events={bookings?.events??[]} truncated={bookings?.truncated??false} />}
       </PlacementPanelErrorBoundary> : null}
      <section className={isTpo?"border-b border-border pb-5 "+calendarStyles.tpoCommandBar:"border-b border-border pb-5"}>
        <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-base font-semibold text-foreground">
              Calendar controls
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Showing {dateLabel(window.from)} –{" "}
              {dateLabel(window.to)} · IST
            </p>
          </div>
          <div
            className={"grid w-full min-w-0 grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap "+(isTpo?calendarStyles.tpoViewSwitch:"")}
            role="group"
            aria-label="Calendar view"
          >
            {VIEWS.map((view) => (
              <Link
                key={view}
                href={calendarHref(
                  basePath,
                  audience,
                  state,
                  { view },
                )}
                aria-current={
                  state.view === view
                    ? "page"
                    : undefined
                }
                className={
                  state.view === view
                    ? "inline-flex min-h-11 min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-3 text-center text-sm font-semibold capitalize text-[var(--lms-on-primary)] md:min-h-9 md:px-4"
                    : "inline-flex min-h-11 min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-center text-sm font-semibold capitalize text-body hover:text-[var(--lms-link-text)] md:min-h-9 md:px-4"
                }
              >
                {view}
              </Link>
            ))}
          </div>
        </div>

        <div className={"mt-4 grid min-w-0 grid-cols-3 items-center gap-2 sm:flex sm:flex-wrap "+(isTpo?calendarStyles.tpoNavigationRow:"")}>
          <Link
            href={calendarHref(
              basePath,
              audience,
              state,
              { anchor: previous },
            )}
            aria-label="Previous calendar period"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-body hover:text-[var(--lms-link-text)] md:min-h-9 md:w-auto md:px-4"
          >
            ←
          </Link>
          <Link
            href={calendarHref(
              basePath,
              audience,
              state,
              { anchor: today },
            )}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-body hover:text-[var(--lms-link-text)] md:min-h-9 md:w-auto md:px-4"
          >
            Today
          </Link>
          <Link
            href={calendarHref(
              basePath,
              audience,
              state,
              { anchor: next },
            )}
            aria-label="Next calendar period"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-body hover:text-[var(--lms-link-text)] md:min-h-9 md:w-auto md:px-4"
          >
            →
          </Link>
          <span className="order-first col-span-3 min-w-0 break-words text-sm font-semibold text-foreground sm:order-none sm:ml-2">
            {state.view === "week"
              ? `${dateLabel(window.from)} – ${dateLabel(window.to)}`
              : monthLabel(state.anchor)}
          </span>
        </div>

        <form
          key={[
            state.anchor,
            state.view,
            state.company,
            state.kind,
            state.roundKind,
            state.job,
            state.jobId,
          ].join(":")}
          action={basePath}
          method="get"
          className="mt-[var(--lms-space-4)] grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-4)] sm:grid-cols-2 lg:grid-cols-3"
        >
          <Input
            type="hidden"
            name="view"
            value={state.view}
          />

          <label className="flex min-w-0 flex-col gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
            Date
            <Input
              type="date"
              name="date"
              defaultValue={state.anchor}
              required
              className="w-full"
            />
          </label>

          <label className="flex min-w-0 flex-col gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
            Company
            <Input
              type="search"
              list="tpo-calendar-company-choices"
              name="company"
              maxLength={150}
              defaultValue={state.company}
              placeholder="Search company name"
              className="w-full"
            />
          </label>

          {isTpo&&countSourceEvents.length>0?<details aria-label="Quick company filters" open={Boolean(state.company)} className="min-w-0 sm:col-span-2 lg:col-span-3">
    <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Companies in this period</summary>
    <div className="flex max-w-full flex-wrap items-center gap-2 pt-2">
    {[...new Set(countSourceEvents.map(event=>event.companyName).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b,"en-IN")).slice(0,16).map(name=>
      <FilterChipLink key={name} href={calendarHref(basePath,audience,state,{company:name})}
        selected={state.company===name} className="max-w-52 truncate"
        title={name}>{name}</FilterChipLink>)}
    {state.company?<Link href={calendarHref(basePath,audience,state,{company:""})}
       className="inline-flex min-h-11 items-center text-xs text-[var(--lms-link-text)] underline">All companies</Link>:null}
   </div></details>:null}
   {isTpo?<datalist id="tpo-calendar-company-choices">
           {[...new Set(countSourceEvents.map(event=>event.companyName).filter(Boolean))]
             .sort((a,b)=>a.localeCompare(b,"en-IN")).slice(0,200).map(name=><option key={name} value={name}/>)}
          </datalist>:null}
          {isTpo ? (
            <label className="flex min-w-0 flex-col gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
              Event type
              <Select
                name="kind"
                defaultValue={state.kind ?? ""}
                className="w-full"
              >
                {EVENT_FILTERS.map((filter) => (
                  <option
                    key={filter.value}
                    value={filter.value}
                  >
                    {filter.label}
                  </option>
                ))}
              </Select>
            </label>
          ) : (
            <details className="min-w-0 sm:col-span-2 lg:col-span-3" open={Boolean(state.job || state.jobId || (state.roundKind && state.roundKind!=="INTERVIEW"))}>
              <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lg:min-h-9">Filters</summary>
              <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
                Round type
                <Select
                  name="roundKind"
                  defaultValue={state.roundKind ?? ""}
                  className="w-full"
                >
                  {ROUND_FILTERS.map((filter) => (
                    <option
                      key={filter.value}
                      value={filter.value}
                    >
                      {filter.label}
                    </option>
                  ))}
                </Select>
              </label>

              {state.jobId?<Input type="hidden" name="jobId" value={state.jobId}/>:null}
              <label className="flex min-w-0 flex-col gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
                Job
                <Input
                  type="search"
                  name="job"
                  maxLength={150}
                  defaultValue={state.job}
                  placeholder="Search job title"
                  className="w-full"
                />
              </label>
              </div>
            </details>
          )}

          <div className="flex min-w-0 items-end">
            <Button type="submit" className="min-h-11 w-full lg:min-h-9"
            >
              Apply filters
            </Button>
          </div>
          {!isTpo && (state.company || state.job || state.jobId || (state.roundKind && state.roundKind !== "INTERVIEW")) ? (
            <Link href={basePath + "?" + new URLSearchParams({date:state.anchor,view:state.view}).toString()}
              className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-[var(--lms-link-text)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">
              Clear filters
            </Link>
          ) : null}
        </form>
        {!isTpo && state.jobId?<p role="status" className="mt-2 text-sm text-body">
          Job filter: <span className="font-semibold">{response.events.find(event => event.jobId === state.jobId)?.jobTitle || state.jobId}</span>{" "}
          <Link href={calendarHref(basePath,audience,state,{jobId:""})}
            className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Remove job filter</Link>
        </p>:null}
        {isTpo && (state.company || state.kind || state.kinds.length) ? (
          <Link href={basePath} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] underline">Show everything</Link>
        ) : null}
      </section>

      {isTpo?<nav aria-label="Filter calendar by event type" className="flex min-w-0 flex-wrap gap-2">
 <FilterChipLink href={calendarHref(basePath,audience,state,{kind:undefined,kinds:[]})}
   selected={!state.kind&&!state.kinds.length}>
   All events ({eventTypeCountsSource&&blockedDays?.ready?countSourceEvents.length+toTpoBlockedCalendarEvents(blockedDays.rows,window.from,window.to).length:"unavailable"})
  </FilterChipLink>
 {TPO_CALENDAR_CHIP_CHOICES.map(filter=>{
  const count=filter.value==="BLOCKED"?(blockedDays?.ready?eventTypeCounts.get("BLOCKED")??0:"unavailable"):(eventTypeCountsSource?tpoCalendarChipCount(eventTypeCountsSource.events,filter.value):"unavailable");
  const active=state.kinds.includes(filter.value)||(!state.kinds.length&&state.kind===filter.value);
  const currently=state.kinds.length?state.kinds:parseTpoCalendarChips(state.kind);
  const nextKinds=toggleTpoCalendarChip(currently,filter.value);
  return <FilterChipLink key={filter.value} href={calendarHref(basePath,audience,state,{kind:undefined,kinds:nextKinds})}
    selected={active}
    aria-label={filter.label+" ("+count+"), "+(active?"selected":"not selected")}>
    <span aria-hidden="true" className={"mr-1.5 inline-block h-2.5 w-2.5 rounded-[var(--lms-radius-pill)] "+(filter.value==="BLOCKED"?"bg-muted-foreground":filter.value==="APPLICATION_DEADLINE"?"bg-warning":filter.value==="FOLLOW_UP"?"bg-success":"bg-primary")}/>
    {filter.label} ({count})
   </FilterChipLink>;
 })}
 <p className="self-center text-xs text-muted-foreground">Select multiple event types to combine them · rounds, talks, deadlines, follow-ups and blocked days (IST).</p>
 {eventTypeCounts.has("INTERVIEW_SLOT")?<p className="self-center text-xs text-muted-foreground">
        {eventTypeCounts.get("INTERVIEW_SLOT")} interview slot events are included in All events.
       </p>:null}
      </nav>:null}

      <section
        aria-label="Next scheduled calendar event"
        className="min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-base font-semibold text-foreground">
              Next scheduled
            </h2>
            {summary.next ? (
              <p className="mt-1 break-words [overflow-wrap:anywhere] text-sm text-body">
                {summary.next.companyName} ·{" "}
                {summary.next.title} ·{" "}
                {eventDateTime(
                  summary.next.startsAt,
                )}{" "}
                IST
              </p>
            ) : (
              <p className="mt-1 text-sm text-body">
                {loadedResponse ? "No upcoming event matches this period and these filters." : "The event schedule could not be loaded. Retry."}
              </p>
            )}
          </div>
          {summary.next &&
          eventHref(summary.next, audience) ? (
            <Link
              href={eventHref(
                summary.next,
                audience,
              )!}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-link-text)] hover:underline sm:w-auto"
            >
              Open event →
            </Link>
          ) : null}
        </div>
      </section>

      {isTpo&&state.view==="week"&&blockedEvents.length>0?<section
        aria-label="All-day blocked dates" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4">
        <h2 className="text-sm font-semibold text-foreground">Blocked (exam) dates · All day</h2>
        <ul className="mt-2 flex flex-wrap gap-2">{blockedEvents.map(event=>
         <li key={event.id} className="rounded-[var(--lms-control-radius)] border border-border bg-muted px-3 py-2 text-sm text-body">
          <strong>{dateLabel(placementCalendarDayKey(event.startsAt))} · Blocked</strong>
          {event.note?<p className="text-xs">{event.note}</p>:null}
         </li>)}</ul>
       </section>:null}
      {isTpo&&state.view==="week"?<TpoWeekHourCalendar days={window.days}
       nowIso={now.toISOString()} collegeId={collegeId} canCreate={calendarFollowupsWritable}
       blockedDates={blockedDays?.rows.map(row=>row.day)??[]} blockedDatesAvailable={blockedDays?.ready??false}
       events={visibleEvents.filter(item=>item.kind!=="BLOCKED").map(item=>({
        id:item.id,title:item.title,companyName:item.companyName,kind:item.kind,
        roundKind:item.roundKind,status:item.status,jobId:item.jobId,roundId:item.roundId,followupId:item.followupId,
        startsAt:item.startsAt.toISOString(),endsAt:item.endsAt?.toISOString()??null,
        href:eventHref(item,audience),
       }))}/>:state.view !== "agenda" ? (
        <section
          aria-label={`${state.view} placement calendar`} tabIndex={0}
          className={"hidden min-w-0 overflow-x-auto overscroll-x-contain rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[992px]:block "+(isTpo?calendarStyles.tpoMonthFrame:"")}
        >
          <CalendarGrid variant="hairline" className={"min-w-[56rem] "+calendarStyles.calendarHairline}>
            {[
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
              "Sun",
            ].map((label, index) => (
              <div
                key={label}
                className={"py-3 text-center text-xs font-bold uppercase text-muted-foreground "+calendarStyles.calendarWeekday+" "+(index===6?calendarStyles.calendarSunday:"")}
              >
                {label}
              </div>
            ))}

            {window.days.map((day) => {
              const dayEvents =
                byDay.get(day) ?? [];

              const outsideMonth =
                state.view === "month" &&
                day.slice(0, 7) !==
                  state.anchor.slice(0, 7);

              const shown = dayEvents.slice(
                0,
                state.view === "month" ? 2 : 4,
              );

              return (
                <div
                  key={day}
                  aria-label={`${dateLabel(day)}: ${dayEvents.length} events`}
                  aria-current={day===today?"date":undefined}
                  className={
                    "min-h-32 border p-2 " +calendarStyles.calendarDay+" "+
                    (day===today?calendarStyles.calendarCurrentDay+" ":"")+
                    (new Date(day+"T12:00:00Z").getUTCDay()===0?calendarStyles.calendarSunday+" ":"")+
                    (outsideMonth
                      ? "bg-muted/40"
                      : "bg-surface")
                  }
                >
                  <p
                    className={
                      (day === today
                        ? "m-0 text-xs font-bold text-[var(--lms-link-text)]"
                        : "m-0 text-xs font-semibold text-foreground") +
                      (day!==today&&new Date(day+"T12:00:00Z").getUTCDay()===0?" "+calendarStyles.calendarSunday:"")
                    }
                  >
                    {dayLabel(day)}
                    {day === today ? " · Today" : ""}
                  </p>

                  <div className="mt-2 space-y-1">
                    {shown.map((event) => {
                      const href = eventHref(
                        event,
                        audience,
                      );

                      return href ? (
                        <Link
                          key={event.id}
                          href={href}
                          title={`${eventTime(event.startsAt)} IST · ${event.companyName} · ${event.title}`}
                          className="block min-h-9 rounded-[var(--lms-control-radius)] bg-primary-subtle px-2 py-1 text-xs font-semibold text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)] max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center"
                        >
                          <span className="block truncate">
                            {eventTime(
                              event.startsAt,
                            )}
                          </span>
                          <span className="block truncate">
                            {event.title}
                          </span>
                        </Link>
                      ) : (
                        <div
                          key={event.id}
                          className="rounded-[var(--lms-control-radius)] bg-muted px-2 py-1 text-xs text-body"
                        >
                          {event.title}
                        </div>
                      );
                    })}

                    {dayEvents.length > shown.length ? (
                      <p className="text-xs font-semibold text-muted-foreground">
                        +{dayEvents.length - shown.length} more
                      </p>
                    ) : null}

                    {dayEvents.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        —
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CalendarGrid>
        </section>
      ) : null}

      <section
        aria-label="Calendar agenda"
        className="min-w-0 space-y-4"
      >
        <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="m-0 text-base font-semibold text-foreground">
              {state.view === "agenda"
                ? "Agenda"
                : "Events in visible period"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loadedResponse
                ? `${visibleEvents.length} matching event${visibleEvents.length === 1 ? "" : "s"}`
                : "Matching event count unavailable"} ·{" "}
              {dateLabel(window.from)} –{" "}
              {dateLabel(window.to)}
            </p>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            All times IST
          </p>
        </div>

        {state.view!=="agenda"?<p className="text-xs text-muted-foreground min-[992px]:hidden">Calendar events are listed below for a better fit on small screens.</p>:null}
        {!loadedResponse ? (
          <div role="status" className="border-y border-border py-8 text-sm text-warning-text">
            Calendar events could not be loaded. Use Retry above to refresh.
          </div>
        ) : groups.length === 0 ? (
          <div className="border-y border-border py-8 text-sm text-body">
            {state.view==="agenda"?TPO_EMPTY_AGENDA:
             "No calendar events match this date range and these filters. Try another date, company or event type."}
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.day}
              className="space-y-3"
            >
              <h3 className="m-0 border-b border-border pb-2 text-sm font-semibold text-foreground">
                {dateLabel(group.day)}
                {group.day === today
                  ? " · Today"
                  : ""}
              </h3>
              <div className="min-w-0 divide-y divide-border border-b border-border">
                {group.events.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    audience={audience}
                    allowFollowupEditing={calendarFollowupsWritable}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
