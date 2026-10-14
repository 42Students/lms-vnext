import {z} from "zod";
import {groupRuleCriteriaSchema} from "./rule-evaluator";
const uuid=z.string().uuid();
export const collegeGroupDetailWriteSchema=z.discriminatedUnion("action",[
  z.strictObject({
    action:z.literal("PROMOTE_WAITLIST"),memberId:uuid,
    expectedGroupVersion:z.number().int().nonnegative(),
    expectedMemberVersion:z.number().int().nonnegative(),confirm:z.literal(true),
  }),
  z.strictObject({
    action:z.literal("SAVE_RULE"),criteria:groupRuleCriteriaSchema,
    autoRefresh:z.boolean(),expectedGroupVersion:z.number().int().nonnegative(),
    confirm:z.literal(true),
  }),
]);
export const collegeGroupDetailIdSchema=uuid;
/** Manual promotion must preserve the queue and never consume a seat for a
 * revoked learner, a locked row, or stale evidence from the detail screen. */
export function collegeWaitlistPromotionBlocker(input: {
  accountStatus: string;
  membershipStatus: string;
  state: string;
  memberType: string;
  locked: boolean;
  memberVersion: number;
  expectedMemberVersion: number;
  firstInQueue: boolean;
  capacity: number | null;
  activeCount: number;
}): "MEMBER_NOT_FOUND" | "MEMBER_STALE" | "WAITLIST_OUT_OF_ORDER" | "GROUP_CAPACITY_FULL" | null {
  if (input.accountStatus !== "ACTIVE" || input.membershipStatus !== "ACTIVE" ||
    input.state !== "WAITLISTED" || input.memberType !== "LEARNER" || input.locked)
    return "MEMBER_NOT_FOUND";
  if (input.memberVersion !== input.expectedMemberVersion) return "MEMBER_STALE";
  if (!input.firstInQueue) return "WAITLIST_OUT_OF_ORDER";
  if (input.capacity !== null && input.activeCount >= input.capacity) return "GROUP_CAPACITY_FULL";
  return null;
}
export function collegeGroupDetailActionLabel(action:"PROMOTE_WAITLIST"|"SAVE_RULE") {
  return action==="PROMOTE_WAITLIST"
    ?"Promote the first waitlisted learner into an available seat?"
    :"Save this group eligibility rule? This does not immediately refresh members.";
}
