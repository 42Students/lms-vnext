import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {createPlacementJob} from "./job-service";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {placementJobIdSchema} from "./validation";
import {PlacementsServiceError} from "./errors";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";

const cloneCommand=z.object({confirmed:z.literal(true)}).strict();

/** TPO-drives-26 / TPO-drive-workspace-05. Clone into a fresh season as DRAFT. */
export async function cloneTpoDrive(context:RequestContext,rawJobId:unknown,raw:unknown){
 cloneCommand.parse(raw);
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const [source]=await getDb().select().from(placementJobs).where(and(
  eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!source)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 if(!["CLOSED","CANCELLED"].includes(source.status))
  throw new Error("Only completed or cancelled drives can be run again.");
 const draft=await createPlacementJob(context,{
  collegeId,companyRelationshipId:source.companyRelationshipId,
  title:source.title.slice(0,100),description:source.description,
  employmentType:source.employmentType as "FULL_TIME"|"INTERNSHIP"|"CONTRACT",
  workMode:source.workMode as "ONSITE"|"REMOTE"|"HYBRID",
  locations:source.locations,openings:source.openings,
  minimumAnnualCtcInr:source.minimumAnnualCtcInr,
  maximumAnnualCtcInr:source.maximumAnnualCtcInr,
  // Never carry a past deadline or old company portal URL into a new drive.
  applicationMode:"INTERNAL",externalApplicationUrl:null,applicationDeadline:null,
 });
 await getDb().transaction(tx=>recordActivityEventInTransaction(tx,context,{
  eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_DRAFT_CREATED,collegeId,
  subjectType:"placement_job",subjectId:draft.id,subjectLabel:draft.title,
  summary:"New placement drive draft copied from a historical drive",
  metadata:{sourceJobId:source.id,sourceStatus:source.status,
   cleared:["dates","rounds","applications","results","offers","batch audiences",
    "passing years","external portal link"]},
  groupKey:"placement-jobs:"+collegeId,
 }));
 return {jobId:draft.id,sourceJobId:source.id,status:draft.status,
  cleared:["Deadlines","Rounds","Applications","Results","Offers","Batch targets","Passing years","External portal link"]};
}
