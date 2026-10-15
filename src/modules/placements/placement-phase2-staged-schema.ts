/**
 * P-S1-05 / P-S1-06 / P-S2-11 proposed columns; not registered.
 * Never import these builders into the runtime schema before approval.
 */
import { boolean, uuid } from "drizzle-orm/pg-core";

export const proposedPlacementJobIsDream = boolean("is_dream")
  .notNull().default(false);
export const proposedPlacementCascadeId = uuid("cascade_id");
