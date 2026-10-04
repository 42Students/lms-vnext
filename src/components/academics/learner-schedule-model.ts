export type LearnerScheduleView =
  | "month"
  | "week"
  | "day";

export type ScheduleFilterEvent = {
  deliveryId: string | null;
  startsAt: string;
  endsAt: string;
};

export function startOfLocalDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

export function localDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function shiftCalendarAnchor(
  date: Date,
  view: LearnerScheduleView,
  direction: -1 | 1,
) {
  if (view === "month") {
    return new Date(
      date.getFullYear(),
      date.getMonth() + direction,
      1,
    );
  }

  return addDays(
    date,
    direction * (view === "week" ? 7 : 1),
  );
}

export function calendarDays(
  anchor: Date,
  view: LearnerScheduleView,
) {
  if (view === "day") {
    return [startOfLocalDay(anchor)];
  }

  if (view === "week") {
    const start = startOfLocalDay(anchor);
    start.setDate(start.getDate() - start.getDay());
    return Array.from(
      { length: 7 },
      (_, index) => addDays(start, index),
    );
  }

  const first = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    1,
  );
  const start = addDays(first, -first.getDay());

  return Array.from(
    { length: 42 },
    (_, index) => addDays(start, index),
  );
}

export function filterScheduleEvents<
  T extends ScheduleFilterEvent,
>(
  events: readonly T[],
  selectedDeliveryIds: readonly string[],
) {
  const selected = new Set(selectedDeliveryIds);

  return events.filter(
    (event) =>
      event.deliveryId === null ||
      selected.has(event.deliveryId),
  );
}

export function eventsForDay<
  T extends Pick<
    ScheduleFilterEvent,
    "startsAt" | "endsAt"
  >,
>(events: readonly T[], day: Date) {
  const target = localDayKey(day);

  return events.filter(
    (event) =>
      localDayKey(new Date(event.startsAt)) ===
      target,
  );
}

export function upcomingScheduleEvents<
  T extends Pick<
    ScheduleFilterEvent,
    "startsAt" | "endsAt"
  >,
>(
  events: readonly T[],
  now: Date,
  limit = 3,
) {
  return events
    .filter(
      (event) =>
        new Date(event.endsAt).getTime() >
        now.getTime(),
    )
    .slice()
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() -
        new Date(b.startsAt).getTime(),
    )
    .slice(0, limit);
}
