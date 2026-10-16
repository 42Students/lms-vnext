/** DB06 staged only: register migration before enabling multipart writes. */
import {pgTable,uuid,integer,text,timestamp,uniqueIndex,index,check} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import {assignmentSubmissions} from "./assessments";
export const assignmentSubmissionLinks=pgTable("assignment_submission_links",{
 id:uuid("id").primaryKey().defaultRandom(),
 submissionId:uuid("submission_id").notNull().references(()=>assignmentSubmissions.id,{onDelete:"cascade"}),
 sequence:integer("sequence").notNull(),kind:text("kind").notNull(),
 url:text("url").notNull(),caption:text("caption").notNull().default(""),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},table=>[
 uniqueIndex("assignment_submission_links_submission_sequence_uq").on(table.submissionId,table.sequence),
 index("assignment_submission_links_submission_idx").on(table.submissionId),
 check("assignment_submission_links_sequence_ck",sql`${table.sequence} between 0 and 19`),
 check("assignment_submission_links_kind_ck",sql`${table.kind} in ('REPOSITORY_LINK','EXTERNAL_LINK')`),
]);
