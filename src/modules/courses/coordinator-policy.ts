/**
 * Course coordinator rules, kept free of the database so they can be tested and reasoned about on their own.
 *
 * A coordinator is one of an offering's own teachers, nominated by the college admin (one per offering). The
 * nomination is only a claim: it counts while every live fact below holds, and stops counting the moment one fails.
 * Nothing here is cached, and the same facts are re-read inside each write transaction.
 */
export type CoordinatorFacts = {
  /** A grant row for this offering and this membership exists and is not revoked. */
  grantActive: boolean;
  /** The grant's college is the offering's college and the person's membership college. */
  sameCollege: boolean;
  userActive: boolean;
  membershipActive: boolean;
  hasFacultyRole: boolean;
  /** They hold an active teaching assignment on an active section delivery of this offering. */
  teachesOffering: boolean;
};

/** Whether the nomination counts right now. */
export function coordinatorGrantCounts(facts: CoordinatorFacts): boolean {
  return (
    facts.grantActive &&
    facts.sameCollege &&
    facts.userActive &&
    facts.membershipActive &&
    facts.hasFacultyRole &&
    facts.teachesOffering
  );
}

export type CoordinatorContentTarget = {
  /** null = shared across the offering's sections ("all classes"). */
  deliveryId: string | null;
  /** The person actively teaches the targeted delivery (always false for shared content). */
  teachesTargetDelivery: boolean;
};

/**
 * The coordinator may change shared (all-classes) content of their offering, and content of the sections they teach.
 * Another teacher's section-only content is out of reach even though it belongs to the same offering.
 */
export function coordinatorMayChange(
  facts: CoordinatorFacts,
  target: CoordinatorContentTarget,
): boolean {
  if (target.deliveryId === null) {
    return coordinatorGrantCounts(facts);
  }
  return (
    target.teachesTargetDelivery &&
    facts.userActive &&
    facts.membershipActive &&
    facts.hasFacultyRole &&
    facts.sameCollege
  );
}

/** Teachers a college admin may nominate: active, faculty, in the college, and teaching this offering. */
export function isEligibleNominee(
  facts: Omit<CoordinatorFacts, "grantActive">,
): boolean {
  return (
    facts.sameCollege &&
    facts.userActive &&
    facts.membershipActive &&
    facts.hasFacultyRole &&
    facts.teachesOffering
  );
}

/** Actions written to the append-only event log. */
export const COORDINATOR_EVENT_ACTIONS = ["GRANTED", "REGRANTED", "REVOKED"] as const;
export type CoordinatorEventAction = (typeof COORDINATOR_EVENT_ACTIONS)[number];
