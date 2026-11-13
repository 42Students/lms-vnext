import { DEFAULT_TIME_ZONE } from "@/config/locale";

/**
 * The one source of "now". Production code asks the clock; tests install a fixed or stepped one, so time-dependent rules
 * (deadlines, expiries, schedules) are exercised without sleeping or patching Date globally.
 */
export type Clock = () => number;

const systemClock: Clock = () => Date.now();
let active: Clock = systemClock;

export function nowMs(): number {
  return active();
}

export function now(): Date {
  return new Date(active());
}

/** Test seam. Returns a function that restores the previous clock. */
export function installClock(clock: Clock): () => void {
  const previous = active;
  active = clock;
  return () => {
    active = previous;
  };
}

export function fixedClock(at: Date | number | string): Clock {
  const ms = new Date(at).getTime();
  return () => ms;
}

/**
 * The time zone a college's calendar uses. Every college is on the platform default today; when a per-college zone is stored
 * this is the only function that changes, and every caller picks it up.
 */
export function timeZoneForCollege(_collegeId?: string | null): string {
  return DEFAULT_TIME_ZONE;
}
