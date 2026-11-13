/**
 * Every rate limit and timeout the app applies, in one place. Routes and clients name a tier ("BULK", "REQUEST"); the number
 * lives here, so tightening a limit or lengthening a timeout is one edit that every caller picks up.
 */
export type RateLimit = Readonly<{ limit: number; windowMs: number }>;

export const RATE_LIMITS = Object.freeze({
  /** Staff bulk tools (imports, exports, reports): generous per-user ceiling per minute. */
  BULK: { limit: 3000, windowMs: 60_000 },
  /** Expensive or sensitive actions a person triggers by hand. */
  STRICT: { limit: 60, windowMs: 60_000 },
} as const satisfies Record<string, RateLimit>);

export type TimeoutName = "SHORT" | "QUICK" | "REQUEST" | "STANDARD" | "EXTENDED" | "LONG" | "SLOW" | "BATCH" | "VERY_SLOW" | "UPLOAD";

/** Typed as plain numbers so a parameter defaulting to a tier is still a number, not one literal. */
export const TIMEOUT_MS: Readonly<Record<TimeoutName, number>> = Object.freeze({
  SHORT: 5_000,
  QUICK: 10_000,
  /** A normal API call from a browser. */
  REQUEST: 12_000,
  STANDARD: 15_000,
  EXTENDED: 20_000,
  LONG: 25_000,
  SLOW: 30_000,
  BATCH: 35_000,
  VERY_SLOW: 40_000,
  /** Uploads and other transfers that move real data. */
  UPLOAD: 120_000,
});
