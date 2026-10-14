import { z } from "zod";
import {
  tpoParticipationChangeSchema,
  type TpoMembershipDecisionSnapshot,
} from "./tpo-participation-model";

/**
 * A tagged member-level INELIGIBLE decision, not a DB08 timed/drive-based
 * debarment. Tagging avoids clearing an unrelated ineligible override.
 */
export const TPO_DEBAR_REASON_PREFIX = "Debar: ";

export const tpoDebarActionSchema = z.object({
  action: z.enum(["DEBAR", "REMOVE_DEBAR"]),
  reason: z.string().trim().min(1).max(200 - TPO_DEBAR_REASON_PREFIX.length).optional(),
}).strict().superRefine((value, context) => {
  if (value.action === "DEBAR" && !value.reason) {
    context.addIssue({
      code: "custom",
      path: ["reason"],
      message: "A reason is required to debar a learner",
    });
  }
  if (value.action === "REMOVE_DEBAR" && value.reason !== undefined) {
    context.addIssue({
      code: "custom",
      path: ["reason"],
      message: "Removing a debar does not accept a reason",
    });
  }
});

export function isTpoDebarDecision(
  current: TpoMembershipDecisionSnapshot,
): boolean {
  return current.status === "INELIGIBLE" &&
    Boolean(current.reason?.startsWith(TPO_DEBAR_REASON_PREFIX));
}

/**
 * Delegates the final payload validation to the same schema as the
 * production service. The API route uses that service's optimistic
 * expected snapshot and centralized college scope.
 */
export function buildTpoDebarDecision(
  actionInput: unknown,
  expected: TpoMembershipDecisionSnapshot,
) {
  const action = tpoDebarActionSchema.parse(actionInput);
  if (action.action === "DEBAR") {
    if (expected.status === "INELIGIBLE" && !isTpoDebarDecision(expected)) {
      throw new Error("An unrelated ineligible decision must be edited in Participation.");
    }
    return tpoParticipationChangeSchema.parse({
      status: "INELIGIBLE",
      reason: TPO_DEBAR_REASON_PREFIX + action.reason,
      expected,
    });
  }
  if (!isTpoDebarDecision(expected)) {
    throw new Error("No Debar-labelled learner decision is present to remove.");
  }
  return tpoParticipationChangeSchema.parse({
    status: "NOT_DECIDED",
    expected,
  });
}
