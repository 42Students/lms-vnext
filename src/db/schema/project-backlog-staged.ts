import {timestamp,uuid} from "drizzle-orm/pg-core";
/** MEN-projects-meetings-36 staged only.
 * Register docs/proposed-migrations/chat-11-men-projects-meetings-36-product-backlog.sql
 * before replacing projectTasks.sprintId with the nullable definition.
 * Do not import into live schema while the migration remains unregistered.
 */
export const stagedProjectBacklogColumns={
 sprintId:uuid("sprint_id"),
 carriedFromSprintId:uuid("carried_from_sprint_id"),
 carriedOverAt:timestamp("carried_over_at",{withTimezone:true}),
};
