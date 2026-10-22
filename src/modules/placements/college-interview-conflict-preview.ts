import "server-only";
import { and, eq, gt, lt, ne, notExists, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activityEvents, collegeMemberships, placementApplications, placementJobs } from "@/db/schema";
import { placementRoundCandidateSlots as slots } from "@/db/schema/placement-round-candidate-slots";
import type { RequestContext } from "@/modules/identity/context";
import { requireCollegePlacementAdmin } from "./college-drive-read-service";
import { collegeDriveIdSchema } from "./college-drive-read-model";

/** A read-only warning; schedule/edit still repeats authority and interval
 * checks inside its write transaction. Never disclose another candidate's
 * name, appointment ID, company, interviewer, or meeting URL here.
 */
export const collegeInterviewPreviewSchema = z.strictObject({
  applicationId: z.uuid(),
  scheduledAt: z.iso.datetime({offset:true}),
  durationMinutes: z.number().int().min(5).max(480),
  interviewer: z.string().trim().max(255).nullable().optional(),
  room: z.string().trim().max(500).nullable().optional(),
  excludingInterviewId: z.uuid().optional(),
});

export function summarizeCollegeInterviewPreview(
  rows: readonly {
    studentId:string;companyRelationshipId:string;
    interviewerName:string|null;room:string;
  }[],
  candidate:{studentId:string;companyRelationshipId:string;
    interviewer:string;room:string},
) {
  const sameText=(left:string|null,right:string)=>
    Boolean(right)&&Boolean(left)&&left!.trim().toLocaleLowerCase()===right.trim().toLocaleLowerCase();
  return {
    candidate:rows.filter(row=>row.studentId===candidate.studentId).length,
    interviewer:rows.filter(row=>row.companyRelationshipId===candidate.companyRelationshipId &&
      sameText(row.interviewerName,candidate.interviewer)).length,
    room:rows.filter(row=>sameText(row.room,candidate.room)).length,
  };
}
export async function previewCollegeInterviewConflicts(
  context:RequestContext, rawJobId:unknown, rawInput:unknown,
) {
  const input=collegeInterviewPreviewSchema.parse(rawInput);
  const collegeId=await requireCollegePlacementAdmin(context);
  const jobId=collegeDriveIdSchema.parse(rawJobId);
  const db=getDb();
  const [job]=await db.select({
    id:placementJobs.id,companyRelationshipId:placementJobs.companyRelationshipId,
  }).from(placementJobs).where(and(
    eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId),
  )).limit(1);
  if(!job)throw new Error("Drive is not available for interview preview.");
  const [candidate]=await db.select({studentId:placementApplications.membershipId})
    .from(placementApplications)
    .innerJoin(collegeMemberships,and(
      eq(collegeMemberships.id,placementApplications.membershipId),
      eq(collegeMemberships.collegeId,collegeId),
      eq(collegeMemberships.status,"ACTIVE"),
    ))
    .where(and(eq(placementApplications.id,input.applicationId),
      eq(placementApplications.jobId,job.id))).limit(1);
  if(!candidate)throw new Error("Applicant is not available for interview preview.");

  const start=new Date(input.scheduledAt);
  const end=new Date(start.getTime()+input.durationMinutes*60_000);
  const buffer=15*60_000;
  const rows=await db.select({
    studentId:placementApplications.membershipId,
    companyRelationshipId:placementJobs.companyRelationshipId,
    interviewerName:sql<string|null>`coalesce(nullif(trim(${slots.legacyInterviewerName}),''),nullif(trim(${slots.panel}),''))`,
    room:slots.room,
  }).from(slots)
    .innerJoin(placementJobs,and(
      eq(placementJobs.id,slots.jobId),eq(placementJobs.collegeId,collegeId),
    ))
    .innerJoin(placementApplications,eq(placementApplications.id,slots.applicationId))
    .where(and(
      eq(slots.status,"BOOKED"),
      or(
        eq(placementApplications.membershipId,candidate.studentId),
        input.interviewer?.trim()?and(
          eq(placementJobs.companyRelationshipId,job.companyRelationshipId),
          sql`lower(trim(coalesce(nullif(${slots.legacyInterviewerName},''),${slots.panel},'')))=${input.interviewer.trim().toLowerCase()}`,
        ):undefined,
        input.room?.trim()?sql`lower(trim(${slots.room}))=${input.room.trim().toLowerCase()}`:undefined,
      ),
      input.excludingInterviewId?ne(slots.id,input.excludingInterviewId):undefined,
      lt(slots.startsAt,new Date(end.getTime()+buffer)),
      gt(slots.endsAt,new Date(start.getTime()-buffer)),
      sql`coalesce(${slots.legacyInterviewStatus},'SCHEDULED') not in ('COMPLETED','CANCELLED','NO_SHOW')`,
      sql`coalesce(${slots.interviewOutcome},'SCHEDULED') not in ('COMPLETED','NO_SHOW')`,
      notExists(db.select({id:activityEvents.id}).from(activityEvents)
        .where(and(
          eq(activityEvents.collegeId,collegeId),
          eq(activityEvents.subjectType,"placement_round_candidate_slot"),
          eq(activityEvents.subjectId,sql<string>`${slots.id}::text`),
          sql`${activityEvents.eventType} in ('PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED','PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW')`,
        ))),
    ))
    .limit(501);
  const totals=summarizeCollegeInterviewPreview(rows.slice(0,500),{
    studentId:candidate.studentId,
    companyRelationshipId:job.companyRelationshipId,
    interviewer:input.interviewer??"",room:input.room??"",
  });
  const {candidate:learner,interviewer,room}=totals;
  // SQL already filters to matching candidate, same-company interviewer or
  // matching room. Count rows once even if one booking violates multiple rules.
  return {candidate:learner,interviewer,room,
    total:rows.length>500?null:rows.length,
    incomplete:rows.length>500,
  };
}
