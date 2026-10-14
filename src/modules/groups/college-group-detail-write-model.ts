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
export function collegeGroupDetailActionLabel(action:"PROMOTE_WAITLIST"|"SAVE_RULE") {
  return action==="PROMOTE_WAITLIST"
    ?"Promote the first waitlisted learner into an available seat?"
    :"Save this group eligibility rule? This does not immediately refresh members.";
}
