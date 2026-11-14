/**
 * Page sizes by kind of list, defined once. A list names the kind it is; changing "how many rows does a staff list show" is
 * one edit. Server routes still cap what a client may request (see the per-route query schemas); these are the defaults.
 */
export const PAGE_SIZES: Readonly<Record<"COMPACT" | "STANDARD" | "LONG" | "GRID" | "ADMIN" | "BULK", number>> = Object.freeze({
  /** Side panels and activity feeds. */
  COMPACT: 10,
  /** Learner-facing lists. */
  STANDARD: 20,
  /** Staff tables. */
  LONG: 25,
  /** Card grids that fill whole rows (4 x 12). */
  GRID: 48,
  /** Settings and key listings. */
  ADMIN: 50,
  /** Conversation and export reads that must not page mid-thread. */
  BULK: 500,
});
