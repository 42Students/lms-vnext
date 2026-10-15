/**
 * PR-S2-03 (migration 0082) and PR-S2-08 / PR-S2-11 are now registered in
 * src/db/schema/projects.ts. Remaining staged declarations live below.
 */
import { pgTable } from "drizzle-orm/pg-core";
import {boolean,varchar} from "drizzle-orm/pg-core";

/** PR-S2-08: awaiting registered migration; do not import into src/db/schema. */
export const projectMemberKindsStage=pgTable("project_members",{
  roleKind:varchar("role_kind",{length:24}),
  canMutate:boolean("can_mutate"),
});

/** PR-S2-11 resource visibility staged until schema is registered. */
export const projectResourceVisibilityStage=pgTable("project_resources",{
  visibility:varchar("visibility",{length:16}),
});
