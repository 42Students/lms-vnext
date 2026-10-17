import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {createPlacementJob} from "./job-service";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {collegeDriveIdSchema} from "./college-drive-read-model";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
/** COL-placements-09: clone values only; never import candidates, decisions, rounds or outdated dates. */
export async function duplicateCollegeDrive(ctx:RequestContext,rawId:unknown,raw:unknown){
 z.strictObject({confirmed:z.literal(true)}).parse(raw);
 const collegeId=await requireCollegePlacementAdmin(ctx);
 const id=collegeDriveIdSchema.parse(rawId);
 const [old]=await getDb().select().from(placementJobs)
  .where(and(eq(placementJobs.id,id),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!old)throw Error("Drive not found in this college");
 const job=await createPlacementJob(ctx,{
  collegeId,companyRelationshipId:old.companyRelationshipId,
  title:old.title,description:old.description,
  employmentType:old.employmentType as "FULL_TIME"|"INTERNSHIP"|"CONTRACT",
  workMode:old.workMode as "ONSITE"|"REMOTE"|"HYBRID",
  locations:old.locations,openings:old.openings,
  minimumAnnualCtcInr:old.minimumAnnualCtcInr,
  maximumAnnualCtcInr:old.maximumAnnualCtcInr,
  applicationMode:"INTERNAL",externalApplicationUrl:null,
  applicationDeadline:null,
 });
 await getDb().transaction(tx=>recordActivityEventInTransaction(tx,ctx,{
  eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_DRAFT_CREATED,
  collegeId,subjectType:"placement_job",subjectId:job.id,subjectLabel:job.title,
  summary:"College Admin duplicated a drive as a fresh draft",
  metadata:{sourceJobId:old.id,cleared:["dates","rounds","applicants","offers","external links","audience overrides"]},
 }));
 return {jobId:job.id,status:job.status};
}
