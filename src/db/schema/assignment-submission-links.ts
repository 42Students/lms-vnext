/** Registered by migration 0111_assignment_multipart_submissions.sql. */
import {pgTable,uuid,integer,jsonb,text,timestamp,uniqueIndex,index,check} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import {assignmentSubmissions} from "./assessments";
export const assignmentSubmissionLinks=pgTable("assignment_submission_links",{
 id:uuid("id").primaryKey().defaultRandom(),
 submissionId:uuid("submission_id").notNull().references(()=>assignmentSubmissions.id,{onDelete:"cascade"}),
 sequence:integer("sequence").notNull(),kind:text("kind").notNull(),
 /** Historical submission_assets relationship is separate from live FILE receipt. */
 legacyAssetId:integer("legacy_asset_id"),
 legacyAssetIndex:integer("legacy_asset_index"),
 legacyAssetMetadata:jsonb("legacy_asset_metadata")
  .$type<{ originalName?:string; sourceType?:string }>(),
 url:text("url").notNull(),caption:text("caption").notNull().default(""),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},table=>[
 uniqueIndex("assignment_submission_links_submission_sequence_uq").on(table.submissionId,table.sequence),
 index("assignment_submission_links_submission_idx").on(table.submissionId),
 check("assignment_submission_links_sequence_ck",sql`${table.sequence} between 0 and 19`),
 check("assignment_submission_links_legacy_index_ck",
  sql`${table.legacyAssetIndex} is null or ${table.legacyAssetIndex} >= 0`),
 check("assignment_submission_links_kind_ck",sql`${table.kind} in ('REPOSITORY_LINK','EXTERNAL_LINK')`),
]);
