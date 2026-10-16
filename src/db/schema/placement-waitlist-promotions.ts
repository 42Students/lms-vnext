import {sql} from "drizzle-orm";
import {check,index,integer,pgTable,text,timestamp,uniqueIndex,uuid,varchar,foreignKey} from "drizzle-orm/pg-core";
import {placementApplications,placementJobRounds,placementJobs,placementOffers} from "./placements";
import {users} from "./users";
/** Registered 0113: durable TPO-drive-workspace-53 waitlist seat promotion ledger. */
export const placementWaitlistPromotions=pgTable("placement_waitlist_promotions",{
 id:uuid("id").defaultRandom().primaryKey(),
 jobId:uuid("job_id").notNull().references(()=>placementJobs.id),
 roundId:uuid("round_id").notNull().references(()=>placementJobRounds.id),
 applicationId:uuid("application_id").notNull().references(()=>placementApplications.id),
 seatNumber:integer("seat_number").notNull(),
 waitlistRank:integer("waitlist_rank").notNull(),
 status:varchar("status",{length:16}).notNull().default("PENDING"),
 reason:text("reason").notNull(),
 offerId:uuid("offer_id").references(()=>placementOffers.id),
 promotedByUserId:uuid("promoted_by_user_id").notNull().references(()=>users.id),
 promotedAt:timestamp("promoted_at",{withTimezone:true}).notNull().defaultNow(),
 releasedAt:timestamp("released_at",{withTimezone:true}),
},t=>[
 uniqueIndex("placement_waitlist_promotions_application_uq").on(t.applicationId),
 uniqueIndex("placement_waitlist_promotions_job_seat_uq").on(t.jobId,t.seatNumber),
 index("placement_waitlist_promotions_job_status_idx").on(t.jobId,t.status),
 foreignKey({columns:[t.roundId,t.jobId],foreignColumns:[placementJobRounds.id,placementJobRounds.jobId],name:"waitlist_promotion_round_job_fk"}),
 check("placement_waitlist_promotions_rank_ck",sql`${t.waitlistRank}>0 and ${t.seatNumber}>0`),
 check("placement_waitlist_promotions_status_ck",sql`${t.status} in ('PENDING','RELEASED')`),
 check("placement_waitlist_promotions_release_ck",sql`(${t.status}='PENDING' and ${t.offerId} is null and ${t.releasedAt} is null) or (${t.status}='RELEASED' and ${t.offerId} is not null and ${t.releasedAt} is not null)`),
 check("placement_waitlist_promotions_reason_ck",sql`length(trim(${t.reason}))>=3`),
]);
