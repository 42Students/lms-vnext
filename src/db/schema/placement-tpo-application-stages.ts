/** Registered in migration 0108: durable applicant progression in a college drive. */
import {sql} from "drizzle-orm";
import {check,foreignKey,index,integer,pgTable,timestamp,uuid,varchar} from "drizzle-orm/pg-core";
import {placementApplications,placementJobs,placementJobRounds} from "./placements";
import {users} from "./users";
export const placementTpoApplicationStages=pgTable("placement_tpo_application_stages",{
 applicationId:uuid("application_id").primaryKey().notNull(),
 jobId:uuid("job_id").notNull(),
 roundId:uuid("round_id").notNull(),
 stage:varchar("stage",{length:20}).notNull(),
 version:integer("version").notNull().default(1),
 changedByUserId:uuid("changed_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 changedAt:timestamp("changed_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 foreignKey({columns:[t.applicationId,t.jobId],foreignColumns:[placementApplications.id,placementApplications.jobId],
  name:"placement_tpo_application_stage_application_fk"}),
 foreignKey({columns:[t.roundId,t.jobId],foreignColumns:[placementJobRounds.id,placementJobRounds.jobId],
  name:"placement_tpo_application_stage_round_fk"}),
 foreignKey({columns:[t.jobId],foreignColumns:[placementJobs.id],name:"placement_tpo_application_stage_job_fk"}),
 index("placement_tpo_application_stage_job_idx").on(t.jobId,t.stage),
 check("placement_tpo_application_stage_kind_ck",sql`${t.stage} in ('TEST','INTERVIEW')`),
 check("placement_tpo_application_stage_version_ck",sql`${t.version} >= 1`),
]);
