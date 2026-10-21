import {
  careerCalendarPeriod,
  careerDayKey,
  shiftCareerCalendarDay,
} from "./learner-career-calendar-model";

export const PLACEMENT_CALENDAR_KINDS = [
  "ROUND",
  "BLOCKED",
  "INTERVIEW_SLOT",
  "APPLICATION_DEADLINE",
  "JOB_IMPORTANT_DATE",
  "FOLLOW_UP",
] as const;

export type PlacementCalendarKind =
  (typeof PLACEMENT_CALENDAR_KINDS)[number];

export type PlacementCalendarView =
  | "week"
  | "month"
  | "agenda";

export type PlacementCalendarEvent = {
  id: string;
  kind: PlacementCalendarKind;
  eventType?: "JOB_IMPORTANT_DATE" | null;
  startsAt: Date;
  /** End time for scheduled rounds with a persisted duration. */
  endsAt?: Date | null;
  /** College label, needed when an employer works with multiple colleges. */
  collegeName?: string | null;

  title: string;
  companyId: string | null;
  companyName: string;

  jobId: string | null;
  jobTitle: string | null;
  /** Exact college-scoped candidate booking, when this event is a slot. */
  applicationId?: string | null;

  roundId: string | null;
  roundKind: string | null;

  leadId: string | null;
  followupId: string | null;

  status: string;
  timezone: string | null;
  venue: string | null;
  note: string | null;
  completedAt: Date | null;
};

export type PlacementCalendarDayGroup = {
  day: string;
  events: PlacementCalendarEvent[];
};

export type PlacementCalendarSummary = {
  total: number;
  rounds: number;
  deadlines: number;
  followups: number;
  next: PlacementCalendarEvent | null;
};

export function placementCalendarDayKey(
  value: Date,
): string {
  return careerDayKey(value);
}

export function sortPlacementCalendarEvents(
  events: readonly PlacementCalendarEvent[],
): PlacementCalendarEvent[] {
  return [...events].sort(
    (a, b) =>
      a.startsAt.getTime() -
        b.startsAt.getTime() ||
      a.id.localeCompare(b.id),
  );
}

/**
 * Group persisted instants by their Asia/Kolkata calendar day.
 * Never use the server's local timezone or mutate the input.
 */
export function groupPlacementCalendarEvents(
  events: readonly PlacementCalendarEvent[],
): PlacementCalendarDayGroup[] {
  const groups = new Map<
    string,
    PlacementCalendarEvent[]
  >();

  for (const event of sortPlacementCalendarEvents(
    events,
  )) {
    const day = placementCalendarDayKey(
      event.startsAt,
    );

    const existing = groups.get(day) ?? [];
    existing.push(event);
    groups.set(day, existing);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, items]) => ({
      day,
      events: items,
    }));
}

/**
 * Reuses the existing learner calendar's Monday-first week
 * and month boundary calculations.
 *
 * Month grids include adjacent-month days, so callers can
 * request the entire visible window from the read service.
 */
export function placementCalendarWindow(
  anchor: string,
  view: PlacementCalendarView,
) {
  // Legacy placement agenda starts on the selected day and includes day +30.
  // Unlike the learner 30-day agenda, this is an inclusive 31-day window.
  if (view === "agenda") {
    return {
      from: anchor,
      to: shiftCareerCalendarDay(anchor, "day", 30),
      days: [] as string[],
    };
  }
  const period = careerCalendarPeriod([], anchor, view);

  if (view === "week") {
    // The legacy TPO calendar starts on Sunday; the learner calendar is
    // Monday-first. Noon UTC avoids a host-timezone-dependent weekday.
    const weekday = new Date(`${anchor}T12:00:00.000Z`).getUTCDay();
    const from = shiftCareerCalendarDay(anchor, "day", -weekday);
    const days = Array.from({length:7},(_,index)=>
      shiftCareerCalendarDay(from,"day",index));
    return {from,to:days[6]!,days};
  }

  const first = period.start;
  const weekday = new Date(
    `${first}T12:00:00.000Z`,
  ).getUTCDay();

  // Legacy TPO month grid starts on Sunday.
  const offset = weekday;

  const gridStart = shiftCareerCalendarDay(
    first,
    "day",
    -offset,
  );

  const days = Array.from(
    { length: 42 },
    (_, index) =>
      shiftCareerCalendarDay(
        gridStart,
        "day",
        index,
      ),
  );

  return {
    from: days[0]!,
    to: days[days.length - 1]!,
    days,
  };
}

export function summarizePlacementCalendar(
  events: readonly PlacementCalendarEvent[],
  now: Date = new Date(),
): PlacementCalendarSummary {
  const sorted = sortPlacementCalendarEvents(
    events,
  );

  return {
    total: sorted.length,
    rounds: sorted.filter(
      (event) => event.kind === "ROUND",
    ).length,
    deadlines: sorted.filter(
      (event) =>
        event.kind === "APPLICATION_DEADLINE",
    ).length,
    followups: sorted.filter(
      (event) => event.kind === "FOLLOW_UP",
    ).length,
    next:
      sorted.find(
        (event) =>
          event.kind !== "BLOCKED" &&
          event.startsAt.getTime() >=
            now.getTime() &&
          !(
            event.kind === "FOLLOW_UP" &&
            event.completedAt !== null
          ),
      ) ?? null,
  };
}
