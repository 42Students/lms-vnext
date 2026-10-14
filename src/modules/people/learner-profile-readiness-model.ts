import { z } from "zod";
import { learnerProfileChecklist } from "./learner-profile-checklist";
import type { LearnerProfileDocument } from "./profile-validation";

export const learnerReadinessQuerySchema = z.object({
  show: z.enum(["all","missing","filled"]).optional(),
}).strict();

/** Report saved-field coverage only, never inferred verification or eligibility. */
export function ownLearnerProfileReadiness(document:LearnerProfileDocument,raw:unknown) {
  const filter=learnerReadinessQuerySchema.safeParse(raw);
  if(!filter.success) return null;
  const all=learnerProfileChecklist(document);
  const show=filter.data.show ?? "all";
  const items=all.items.filter(item=>
    show==="all" || (show==="filled" ? item.completed : !item.completed));
  return {
    show, items, filled:all.completed, missing:all.total-all.completed,
    total:all.total, percentage:all.percentage,
  };
}