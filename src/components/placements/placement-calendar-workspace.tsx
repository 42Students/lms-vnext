import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import {TpoCalendarMoveFollowup} from "@/components/placements/tpo-calendar-followup-actions";
import {TpoNewFollowupModal} from "@/components/tpo/tpo-new-followup-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { SuperAdminInterviewOperations } from "@/components/admin/super-admin-interview-operations";
import { listSuperAdminBookedInterviews } from "@/modules/placements/super-admin-booked-interviews-service";
import { PlacementPanelErrorBoundary } from "@/components/admin/placement-panel-error-boundary";

import { parseActivityDateBoundary } from "@/modules/activity/date-boundary";
import type { RequestContext } from "@/modules/identity/context";

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
import {toTpoBlockedCalendarEvents} from "@/modules/placements/tpo-blocked-calendar-model";
import {summarizeTpoCalendarNeeds} from "@/modules/placements/tpo-calendar-needs-model";
import {tpoLegacyCalendarEventTitle,TPO_CALENDAR_SUBTITLE,TPO_EMPTY_AGENDA} from "@/modules/placements/tpo-calendar-display-model";
import { calendarDueAtToIstLocal } from "@/modules/placements/tpo-calendar-followup-model";
import { placementRoundKinds } from "@/modules/placements/validation";
import { TPO_CALENDAR_CHIP_CHOICES, filterTpoCalendarChipEvents, parseTpoCalendarChips, toggleTpoCalendarChip, tpoCalendarChipCount, type TpoCalendarChip } from "@/modules/placements/tpo-calendar-kind-chips";

type CalendarAudience = "TPO" | "COLLEGE_ADMIN" | "SUPER_ADMIN";

type CalendarSearchParams = {
  date?: string | string[];
  view?: string | string[];
  company?: string | string[];
  kind?: string | string[];
  kinds?: string | string[];
  roundKind?: string | string[];
  job?: string | string[];
};

type CalendarState = {
  anchor: string;
  view: PlacementCalendarView;
  company: string;
  kind: PlacementCalendarKind | undefined;
  kinds: TpoCalendarChip[];
  roundKind: (typeof placementRoundKinds)[number] | undefined;
  job: string;
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
  };
}

function calendarHref(
  basePath: string,
  audience: CalendarAudience,
  state: CalendarState,
  overrides: Partial<
    Pick<CalendarState, "anchor" | "view" | "kind" | "kinds" | "company">
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

    return event.roundId
      ? `${jobHref}#round-${event.roundId}`
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
    <article className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-primary-text">
            {event.companyName}
          </p>
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
              {eventDateTime(event.startsAt)} IST
            </time>
          </p>
          {event.venue ? (
            <p className="mt-1 text-sm text-body">
              Venue: {event.venue}
            </p>
          ) : null}
          {event.note ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-body">
              {event.note}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
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
          className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
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

  const response =
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
    );

  const bookings=audience==="SUPER_ADMIN"?await listSuperAdminBookedInterviews(context,window.from,window.to)
    .then(value=>({...value,failed:false})).catch(()=>({events:[],truncated:false,failed:true})):null;
  const eventTypeCountsSource=audience==="TPO"&&(state.kind||state.company||state.kinds.length)
   ?await listPlacementCalendarEvents(context,{
    collegeId,from:window.from,to:window.to,tpoLegacyScope:true,
   }).catch(()=>null)
   :response;
  const countSourceEvents=eventTypeCountsSource?.events??[];
  const eventTypeCounts=new Map<string,number>();
  for(const item of countSourceEvents
   eventTypeCounts.set(item.kind,(eventTypeCounts.get(item.kind)??0)+1);

  // The shared read service supports event-kind and
  // company filtering. The College Admin and Super Admin
  // job-name filter is a view-level refinement of
  // already authorized rows.
  const events =
    audience !== "TPO" && state.job
      ? response.events.filter((event) =>
          event.jobTitle
            ?.toLocaleLowerCase("en-IN")
            .includes(
              state.job.toLocaleLowerCase("en-IN"),
            ),
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
  const partialCalendar=audience==="TPO"&&(!needsWindow||!eventTypeCountsSource||!blockedDays?.ready);
  const blockedEvents=audience==="TPO"&&blockedDays?.ready&&(state.kinds.length ? state.kinds.includes("BLOCKED") : (!state.kind||state.kind==="BLOCKED"))?
    toTpoBlockedCalendarEvents(blockedDays.rows,window.from,window.to):[];
  const selectedEvents=state.kind==="BLOCKED" && !state.kinds.length ? blockedEvents : [...audienceEvents,...blockedEvents];
  const visibleEvents=audience==="TPO" && state.kinds.length ? filterTpoCalendarChipEvents(selectedEvents,state.kinds) : selectedEvents;
  if(audience==="TPO"&&blockedDays?.ready)
   eventTypeCounts.set("BLOCKED",toTpoBlockedCalendarEvents(blockedDays.rows,window.from,window.to).length);
  const needsEvents=needsWindow?.events??[];
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
  const calendarFollowupsWritable =
    isTpo && process.env.DB09_TPO_API_READY === "DB09_VERIFIED";
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          isTpo
            ? "TPO"
            : audience === "SUPER_ADMIN"
              ? "Super Admin · Placements"
              : "College Admin · Placements"
        }
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
          <Link
            href={
              isTpo
                ? "/tpo/placements"
                : audience === "SUPER_ADMIN"
                  ? "/admin/placements"
                  : "/college/placements"
            }
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
          >
            Placement operations →
          </Link>
        }
      />

      {partialCalendar?<section role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning-border bg-warning-subtle p-4 text-sm">
        <p className="font-semibold text-warning-text">Calendar summary is partially unavailable. The events shown are from the successful calendar read; unavailable counts are not shown as zero.</p>
        <Link href={calendarHref(basePath,audience,state,{})} className="min-h-10 rounded-md border border-border bg-surface px-4 py-2 font-semibold text-primary-text">Retry</Link>
      </section>:null}

      {calendarFollowupsWritable ? (
        <div className="inline-flex rounded-lg border border-border bg-surface p-2">
         <TpoNewFollowupModal collegeId={collegeId}/>
        </div>
      ) : isTpo ? (
        <p role="status" className="text-sm text-muted-foreground">
          Calendar follow-up editing is unavailable until the DB09 CRM
          write gate is verified. Existing calendar events remain read-only.
        </p>
      ) : null}

      {isTpo?<section aria-label="Today and next 7 days" className="rounded-xl border border-border bg-surface p-4">
       <h2 className="text-base font-semibold">Today</h2>
       {needsWindow?todayEvents.length?<ul className="mt-2 space-y-2">{todayEvents.map(event=><li key={event.id} className="text-sm text-body">
         <span className="font-semibold">{eventTime(event.startsAt)}</span>{" · "}{event.title}
         {event.status==="DONE"?<span className="ml-2 text-success-text">Done</span>:null}
        </li>)}</ul>:<p className="mt-2 text-sm text-body">Nothing scheduled today</p>:
         <p role="status" className="mt-2 text-sm text-warning-text">Today&apos;s schedule is unavailable.</p>}
       {needsWindow?<p className="mt-3 text-sm text-body">Next 7 days · {nextSeven.length} scheduled event{nextSeven.length===1?"":"s"}</p>:null}
      </section>:null}
      {isTpo?<section aria-label="Needs doing" className="space-y-3 rounded-xl border border-border bg-surface p-4">
       <h2 className="text-base font-semibold">Needs doing</h2>
       <div className="grid gap-3 sm:grid-cols-3">
        <Link href={overdue.length?basePath+"?view=week&date="+placementCalendarDayKey(overdue[0].startsAt)+"&kind=FOLLOW_UP":basePath}
         className="rounded-md border border-border p-3 text-sm text-primary-text">
         <strong className="block text-lg">{needsWindow?overdue.length:"Unavailable"}</strong>Follow-ups overdue (last 90 days)
        </Link>
        <Link href={blockedRounds.length?basePath+"?view=week&date="+placementCalendarDayKey(blockedRounds[0].startsAt):basePath}
         className="rounded-md border border-border p-3 text-sm text-primary-text">
         <strong className="block text-lg">{needsWindow&&blockedDays?.ready?blockedRounds.length:"Unavailable"}</strong>Rounds on a blocked date
        </Link>
        <Link href={busyDays.length?basePath+"?view=week&date="+busyDays[0][0]:basePath}
         className="rounded-md border border-border p-3 text-sm text-primary-text">
         <strong className="block text-lg">{needsWindow?busyDays.length:"Unavailable"}</strong>Busy days (3 or more)
        </Link>
       </div>
       {!blockedDays?.ready?<p role="status" className="text-xs text-warning-text">
        Blocked-day storage is unavailable; conflict counts cannot be verified.</p>:null}
      </section>:null}
      <section
        aria-label="Calendar summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
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
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {count}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
            className="flex flex-wrap gap-2"
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
                    ? "inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold capitalize text-on-primary"
                    : "inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold capitalize text-body hover:text-primary-text"
                }
              >
                {view}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={calendarHref(
              basePath,
              audience,
              state,
              { anchor: previous },
            )}
            aria-label="Previous calendar period"
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
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
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
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
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
          >
            →
          </Link>
          <span className="ml-2 text-sm font-semibold text-foreground">
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
          ].join(":")}
          action={basePath}
          method="get"
          className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <input
            type="hidden"
            name="view"
            value={state.view}
          />

          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Date
            <input
              type="date"
              name="date"
              defaultValue={state.anchor}
              required
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Company
            <input
              type="search"
              list="tpo-calendar-company-choices"
              name="company"
              maxLength={150}
              defaultValue={state.company}
              placeholder="Search company name"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            />
          </label>

          {isTpo&&countSourceEvents.length>0?<div aria-label="Quick company filters" className="flex max-w-full flex-wrap items-center gap-2">
    <span className="text-xs font-semibold text-muted-foreground">Companies in this period:</span>
    {[...new Set(countSourceEvents.map(event=>event.companyName).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b,"en-IN")).slice(0,16).map(name=>
      <Link key={name} href={calendarHref(basePath,audience,state,{company:name})}
       aria-current={state.company===name?"page":undefined}
       className="inline-flex min-h-9 max-w-52 items-center truncate rounded-full border border-border px-3 text-xs text-primary-text"
       title={name}>{name}</Link>)}
    {state.company?<Link href={calendarHref(basePath,audience,state,{company:""})}
       className="inline-flex min-h-9 items-center text-xs text-primary-text underline">All companies</Link>:null}
   </div>:null}
   {isTpo?<datalist id="tpo-calendar-company-choices">
           {[...new Set(countSourceEvents.map(event=>event.companyName).filter(Boolean))]
             .sort((a,b)=>a.localeCompare(b,"en-IN")).slice(0,200).map(name=><option key={name} value={name}/>)}
          </datalist>:null}
          {isTpo ? (
            <label className="flex flex-col gap-1 text-sm font-semibold text-body">
              Event type
              <select
                name="kind"
                defaultValue={state.kind ?? ""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
              >
                {EVENT_FILTERS.map((filter) => (
                  <option
                    key={filter.value}
                    value={filter.value}
                  >
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Round type
                <select
                  name="roundKind"
                  defaultValue={state.roundKind ?? ""}
                  className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                >
                  {ROUND_FILTERS.map((filter) => (
                    <option
                      key={filter.value}
                      value={filter.value}
                    >
                      {filter.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Job
                <input
                  type="search"
                  name="job"
                  maxLength={150}
                  defaultValue={state.job}
                  placeholder="Search job title"
                  className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                />
              </label>
            </>
          )}

          <div className="flex items-end">
            <button
              type="submit"
              className="min-h-11 w-full rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            >
              Apply filters
            </button>
          </div>
        </form>
        {isTpo && (state.company || state.kind || state.kinds.length) ? (
          <Link href={basePath} className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">Show everything</Link>
        ) : null}
      </section>

      {isTpo?<nav aria-label="Filter calendar by event type" className="flex flex-wrap gap-2">
 <Link href={calendarHref(basePath,audience,state,{kind:undefined,kinds:[]})}
  aria-current={!state.kind&&!state.kinds.length?"page":undefined}
  className={!state.kind&&!state.kinds.length?"inline-flex min-h-10 items-center rounded-full bg-primary px-3 text-xs font-semibold text-on-primary":"inline-flex min-h-10 items-center rounded-full border border-border px-3 text-xs font-semibold text-primary-text"}>
  All events ({eventTypeCountsSource&&blockedDays?.ready?countSourceEvents.length+toTpoBlockedCalendarEvents(blockedDays.rows,window.from,window.to).length:"unavailable"})
 </Link>
 {TPO_CALENDAR_CHIP_CHOICES.map(filter=>{
  const count=filter.value==="BLOCKED"?(blockedDays?.ready?eventTypeCounts.get("BLOCKED")??0:"unavailable"):(eventTypeCountsSource?tpoCalendarChipCount(countSourceEvents,filter.value):"unavailable");
  const active=state.kinds.includes(filter.value)||(!state.kinds.length&&state.kind===filter.value);
  const currently=state.kinds.length?state.kinds:parseTpoCalendarChips(state.kind);
  const nextKinds=toggleTpoCalendarChip(currently,filter.value);
  return <Link key={filter.value} href={calendarHref(basePath,audience,state,{kind:undefined,kinds:nextKinds})}
   aria-current={active?"page":undefined}
   aria-label={filter.label+" ("+count+"), "+(active?"selected":"not selected")}
   className={active?"inline-flex min-h-10 items-center rounded-full bg-primary px-3 text-xs font-semibold text-on-primary":"inline-flex min-h-10 items-center rounded-full border border-border px-3 text-xs font-semibold text-primary-text"}>
   <span aria-hidden="true" className={"mr-1.5 inline-block h-2.5 w-2.5 rounded-full "+(filter.value==="BLOCKED"?"bg-muted-foreground":filter.value==="APPLICATION_DEADLINE"?"bg-warning":filter.value==="FOLLOW_UP"?"bg-success":"bg-primary")}/>
   {filter.label} ({count})
  </Link>;
 })}
 <p className="self-center text-xs text-muted-foreground">Select multiple event types to combine them · rounds, talks, deadlines, follow-ups and blocked days (IST).</p>
 {eventTypeCounts.has("INTERVIEW_SLOT")?<p className="self-center text-xs text-muted-foreground">
        {eventTypeCounts.get("INTERVIEW_SLOT")} interview slot events are included in All events.
       </p>:null}
      </nav>:null}

      <section
        aria-label="Next scheduled calendar event"
        className="rounded-xl border border-border bg-surface p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-base font-semibold text-foreground">
              Next scheduled
            </h2>
            {summary.next ? (
              <p className="mt-1 text-sm text-body">
                {summary.next.companyName} ·{" "}
                {summary.next.title} ·{" "}
                {eventDateTime(
                  summary.next.startsAt,
                )}{" "}
                IST
              </p>
            ) : (
              <p className="mt-1 text-sm text-body">
                No upcoming event matches this period and these filters.
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
              className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline"
            >
              Open event →
            </Link>
          ) : null}
        </div>
      </section>

      {isTpo&&state.view==="week"&&blockedEvents.length>0?<section
        aria-label="All-day blocked dates" className="rounded-xl border border-border bg-surface-subtle p-4">
        <h2 className="text-sm font-semibold text-foreground">Blocked (exam) dates · All day</h2>
        <ul className="mt-2 flex flex-wrap gap-2">{blockedEvents.map(event=>
         <li key={event.id} className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-body">
          <strong>{dateLabel(placementCalendarDayKey(event.startsAt))} · Blocked</strong>
          {event.note?<p className="text-xs">{event.note}</p>:null}
         </li>)}</ul>
       </section>:null}
      {isTpo&&state.view==="week"?<TpoWeekHourCalendar days={window.days}
       nowIso={now.toISOString()} collegeId={collegeId} canCreate={calendarFollowupsWritable}
       blockedDates={blockedDays?.rows.map(row=>row.day)??[]} blockedDatesAvailable={blockedDays?.ready??false}
       events={(state.kind==="BLOCKED"?[]:audienceEvents).map(item=>({
        id:item.id,title:item.title,companyName:item.companyName,kind:item.kind,
        roundKind:item.roundKind,status:item.status,jobId:item.jobId,roundId:item.roundId,followupId:item.followupId,
        startsAt:item.startsAt.toISOString(),endsAt:item.endsAt?.toISOString()??null,
        href:eventHref(item,audience),
       }))}/>:state.view !== "agenda" ? (
        <section
          aria-label={`${state.view} placement calendar`}
          className="hidden overflow-x-auto rounded-xl border border-border bg-surface p-3 md:block"
        >
          <div className="grid min-w-[56rem] grid-cols-7 gap-1">
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
                  className={
                    "min-h-32 rounded-lg border border-border p-2 " +
                    (outsideMonth
                      ? "bg-muted/40"
                      : "bg-surface")
                  }
                >
                  <p
                    className={
                      day === today
                        ? "m-0 text-xs font-bold text-primary-text"
                        : "m-0 text-xs font-semibold text-foreground"
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
                          className="block min-h-8 rounded-md bg-primary-subtle px-2 py-1 text-xs font-semibold text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
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
                          className="rounded-md bg-muted px-2 py-1 text-xs text-body"
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
          </div>
        </section>
      ) : null}

      {audience==="SUPER_ADMIN" ? <PlacementPanelErrorBoundary>
        {bookings?.failed ? <section role="alert" className="rounded-xl border border-border bg-surface p-5">
          <p>Could not load candidate interviews right now. The calendar is still available.</p>
          <Link href={calendarHref(basePath,audience,state,{})}
           className="mt-3 inline-flex min-h-11 items-center rounded border border-border px-4 font-semibold text-primary-text focus-visible:ring-2 focus-visible:ring-primary">Retry interviews</Link>
        </section> : <SuperAdminInterviewOperations today={today} events={bookings?.events??[]} truncated={bookings?.truncated??false} />}
       </PlacementPanelErrorBoundary> : null}
      <section
        aria-label="Calendar agenda"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">
              {state.view === "agenda"
                ? "Agenda"
                : "Events in visible period"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {visibleEvents.length} matching event
              {visibleEvents.length === 1 ? "" : "s"} ·{" "}
              {dateLabel(window.from)} –{" "}
              {dateLabel(window.to)}
            </p>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            All times IST
          </p>
        </div>

        {state.view!=="agenda"?<p className="text-xs text-muted-foreground md:hidden">Calendar events are listed below for a better fit on small screens.</p>:null}
        {groups.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-sm text-body">
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
              <div className="grid gap-3 lg:grid-cols-2">
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
