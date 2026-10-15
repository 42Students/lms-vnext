/**
 * PR-S2-03 staged contract only. Do not import into the registered schema barrel.
 * The orchestrator must register the SQL, re-run migrations on disposable PG,
 * and then wire assignment writes/submitter checks to the real Drizzle column.
 */
import { pgTable, uuid } from "drizzle-orm/pg-core";

export const projectTaskAssigneeStage = pgTable("project_tasks", {
  assigneeMembershipId: uuid("assignee_membership_id"),
});

/** PR-S2-08: awaiting registered migration; do not import into src/db/schema. */
import {boolean,varchar} from "drizzle-orm/pg-core";
export const projectMemberKindsStage=pgTable("project_members",{
  roleKind:varchar("role_kind",{length:24}),
  canMutate:boolean("can_mutate"),
});
