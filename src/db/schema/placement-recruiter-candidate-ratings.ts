/** REC-home-drives-41: private, author-only recruiter candidate rating and note.
 * A row is unique by recruiter and application; no college-wide visibility. */
import {check,index,integer,pgTable,text,timestamp,uniqueIndex,uuid} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import {users} from "./users";
import {placementApplications} from "./placements";
export const placementRecruiterPrivateReviews=pgTable("placement_recruiter_private_reviews",{
 id:uuid("id").defaultRandom().primaryKey(),
 recruiterUserId:uuid("recruiter_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 applicationId:uuid("application_id").notNull().references(()=>placementApplications.id,{onDelete:"restrict"}),
 rating:integer("rating"),
 note:text("note").notNull().default(""),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("prpr_recruiter_application_uq").on(t.recruiterUserId,t.applicationId),
 index("prpr_app_id_idx").on(t.applicationId),
 check("prpr_rating_ck",sql`${t.rating} is null or (${t.rating} between 1 and 5)`),
 check("prpr_note_ck",sql`char_length(${t.note}) <= 1000`),
]);
