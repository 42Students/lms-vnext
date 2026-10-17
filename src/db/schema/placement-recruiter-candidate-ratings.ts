import {sql} from "drizzle-orm";
import {check,index,pgTable,smallint,text,timestamp,uniqueIndex,uuid} from "drizzle-orm/pg-core";
import {placementApplications} from "./placements";
import {users} from "./users";

/** REC-home-drives-41: individual recruiter's rating and note, not company-visible. */
export const placementRecruiterPrivateReviews=pgTable("placement_recruiter_private_reviews",{
 id:uuid("id").defaultRandom().primaryKey(),
 applicationId:uuid("application_id").notNull().references(()=>placementApplications.id,{onDelete:"restrict"}),
 recruiterUserId:uuid("recruiter_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 rating:smallint("rating"),
 note:text("note").notNull().default(""),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("prpr_recruiter_application_uq").on(t.recruiterUserId,t.applicationId),
 index("prpr_application_idx").on(t.applicationId),
 check("prpr_rating_ck",sql`${t.rating} is null or ${t.rating} between 1 and 5`),
 check("prpr_note_ck",sql`length(${t.note}) <= 1000`),
]);
