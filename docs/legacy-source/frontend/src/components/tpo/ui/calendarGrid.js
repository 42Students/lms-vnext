// Week time-grid maths for the TPO calendar: where an event sits, how overlaps share a day column, and which time a click or drop means.
import { dj } from "../dj";

export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 21;
export const HOUR_PX = 52;
export const SNAP_MINUTES = 15;
const ALL_DAY_TYPES = ["DEADLINE", "BLOCKED"];
const DEFAULT_MINUTES = { ROUND: 60, TALK: 60, FOLLOW_UP: 30 };

export const isAllDay = (e) => ALL_DAY_TYPES.includes(e.type);
export const gridHeight = () => (GRID_END_HOUR - GRID_START_HOUR) * HOUR_PX;

const minutesIntoDay = (d) => d.hour() * 60 + d.minute();

/** { top, height } in pixels for a timed event. Events before the first hour or after the last are clamped into the grid so they never vanish. */
export function eventBox(e) {
  const start = dj(e.startsAt);
  const end = e.endsAt ? dj(e.endsAt) : start.add(DEFAULT_MINUTES[e.type] || 45, "minute");
  const first = GRID_START_HOUR * 60;
  const last = GRID_END_HOUR * 60;
  const s = Math.min(Math.max(minutesIntoDay(start), first), last - 15);
  const rawEnd = end.isSame(start, "day") ? minutesIntoDay(end) : last;
  const eMin = Math.min(Math.max(rawEnd, s + 15), last);
  return { top: ((s - first) / 60) * HOUR_PX, height: Math.max(((eMin - s) / 60) * HOUR_PX, 22) };
}

/**
 * Give overlapping events of one day their own lane so they sit side by side instead of on top of each other.
 * Returns [{ event, lane, lanes }] where `lanes` is how many lanes the event's cluster needs.
 */
export function layoutDay(events) {
  const items = events
    .filter((e) => !isAllDay(e))
    .map((e) => ({ event: e, start: dj(e.startsAt).valueOf(), box: eventBox(e) }))
    .sort((a, b) => a.start - b.start || a.box.top - b.box.top);
  const out = [];
  let cluster = [];
  let clusterEnd = -Infinity;
  const flush = () => {
    const lanes = cluster.reduce((m, c) => Math.max(m, c.lane + 1), 1);
    cluster.forEach((c) => out.push({ event: c.event, lane: c.lane, lanes }));
    cluster = [];
  };
  items.forEach((it) => {
    const bottom = it.box.top + it.box.height;
    if (cluster.length && it.box.top >= clusterEnd) { flush(); clusterEnd = -Infinity; }
    const taken = new Set(cluster.filter((c) => c.bottom > it.box.top).map((c) => c.lane));
    let lane = 0;
    while (taken.has(lane)) lane += 1;
    cluster.push({ event: it.event, lane, bottom });
    clusterEnd = Math.max(clusterEnd, bottom);
  });
  flush();
  return out;
}

/** The moment a click or drop at `offsetY` pixels from the top of a day column means, snapped to 15 minutes. */
export function slotFromOffset(day, offsetY) {
  const y = Number.isFinite(offsetY) ? offsetY : 0; // some drag events carry no pointer position
  const raw = (Math.max(0, y) / HOUR_PX) * 60 + GRID_START_HOUR * 60;
  const snapped = Math.min(Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES, GRID_END_HOUR * 60 - SNAP_MINUTES);
  return day.startOf("day").add(snapped, "minute");
}

/** Pixel offset of "now" in today's column, or null when it is outside the grid. */
export function nowOffset(now = dj()) {
  const m = minutesIntoDay(now);
  if (m < GRID_START_HOUR * 60 || m > GRID_END_HOUR * 60) return null;
  return ((m - GRID_START_HOUR * 60) / 60) * HOUR_PX;
}
