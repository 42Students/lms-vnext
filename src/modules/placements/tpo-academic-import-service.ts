import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents, collegeMemberships, membershipRoles, inAppNotifications,
  placementCandidateAcademicEvidence, placementApplications, placementJobs, users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requirePlacementManageScope } from "./scope";
import { tpoAcademicPreviewRowSchema } from "./tpo-academic-preview-import-model";
import {evaluatePlacementEligibility} from "./eligibility-service";
import {tpoAcademicImportNewlyIneligible} from "./tpo-academic-import-recheck-model";

// Bulk CSVs retain the legacy two-field contract. An individual verified
// correction can submit only the fields that changed; absent fields are never
// zeroed or replaced by self-reported values.
const correctionRowSchema=tpoAcademicPreviewRowSchema.partial({
 cgpa:true,activeBacklogs:true,
}).extend({
 studentCode:z.string().uuid(),
 pastBacklogs:z.number().int().min(0).max(100).optional(),
 tenthPercentage:z.number().min(0).max(100).optional(),
 twelfthPercentage:z.number().min(0).max(100).optional(),
 diplomaPercentage:z.number().min(0).max(100).optional(),
 undergraduatePercentage:z.number().min(0).max(100).optional(),
 postgraduatePercentage:z.number().min(0).max(100).optional(),
 gapYears:z.number().int().min(0).max(100).optional(),
 isLateralEntry:z.boolean().optional(),
 passingYear:z.number().int().min(1950).max(2200).optional(),
}).refine(row=>Object.keys(row).some(key=>key!=="studentCode"),{
 message:"Enter at least one academic field to verify.",
});
const schema = z.object({
  rows: z.array(correctionRowSchema).min(1).max(200),
  mode:z.enum(["BULK","SINGLE"]).default("BULK"),
  skipUnmatched: z.boolean().default(false),
}).strict().superRefine((data,ctx)=>{
 if(data.mode==="SINGLE"&&data.rows.length!==1)
  ctx.addIssue({code:"custom",path:["rows"],message:"Choose exactly one learner to correct."});
});
type Input = z.infer<typeof schema>;

async function scope(context: RequestContext) {
  if (!context.membership || context.membership.status !== "ACTIVE" ||
      !hasMembershipRole(context, "TPO"))
    throw new AuthorizationError("placements.manage");
  return requirePlacementManageScope(context, context.membership.collegeId);
}

function noDuplicates(rows: Input["rows"]) {
  if (new Set(rows.map(row => row.studentCode)).size !== rows.length)
    throw new Error("ACADEMIC_IMPORT_DUPLICATE_STUDENT");
}

async function lookup(
  db: ReturnType<typeof getDb>,
  collegeId: string,
  ids: readonly string[],
) {
  if (!ids.length) return [];
  return db.select({
    id: collegeMemberships.id,
    displayName: users.displayName,
    rollNumber: users.id,
    currentCgpa: placementCandidateAcademicEvidence.cgpaHundredths,
    currentBacklogs: placementCandidateAcademicEvidence.activeBacklogs,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER")))
    .leftJoin(placementCandidateAcademicEvidence,
      eq(placementCandidateAcademicEvidence.membershipId, collegeMemberships.id))
    .where(and(eq(collegeMemberships.collegeId, collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
      inArray(collegeMemberships.id, [...ids])));
}

export async function previewTpoAcademicImport(context: RequestContext, raw: unknown) {
  const input = schema.parse(raw);
  noDuplicates(input.rows);
  const college = await scope(context);
  const rows = await lookup(getDb(), college.id, input.rows.map(row => row.studentCode));
  const found = new Map(rows.map(row => [row.id, row]));
  return {
    rows: input.rows.map(row => {
      const match = found.get(row.studentCode);
      return {
        ...row, match: match ? "WILL_UPDATE" as const : "CANT_MATCH" as const,
        name: match?.displayName ?? null,
        oldCgpa: match?.currentCgpa === null || match?.currentCgpa === undefined
          ? null : match.currentCgpa / 100,
        oldBacklogs: match?.currentBacklogs ?? null,
      };
    }),
  };
}

export async function commitTpoAcademicImport(context: RequestContext, raw: unknown) {
  const input = schema.parse(raw);
  noDuplicates(input.rows);
  const college = await scope(context);
  return getDb().transaction(async tx => {
    await assertPersistedPlatformPermission(tx, context, "placements.manage", {
      collegeId: college.id, organizationId: college.organizationId,
    });
    const ids = input.rows.map(row => row.studentCode);
    // Lock the learner membership and role rows with the eligibility read so
    // no campus-admin status or role change can race a verified import.
    const found = await tx.select({
      id: collegeMemberships.id,userId:collegeMemberships.userId,
    }).from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER")))
      .where(and(eq(collegeMemberships.collegeId, college.id),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
        inArray(collegeMemberships.id, ids)))
      .for("share");
    const eligible = new Set(found.map(row => row.id));
    const studentUsers = new Map(found.map(row=>[row.id,row.userId]));
    const staff=await tx.selectDistinct({userId:collegeMemberships.userId}).from(collegeMemberships)
      .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
      .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
      .where(and(eq(collegeMemberships.collegeId,college.id),eq(collegeMemberships.status,"ACTIVE")));
    const missing = ids.filter(id => !eligible.has(id));
    if (missing.length && !input.skipUnmatched)
      throw new Error("ACADEMIC_IMPORT_UNMATCHED_STUDENTS");
    const now = new Date();
    let updated = 0, newlyIneligible = 0;
    for (const row of input.rows) {
      if (!eligible.has(row.studentCode)) continue;
      // Re-evaluate every open application before and after the verified evidence
      // update in the same transaction; never withdraw or delete it.
      const applications=await tx.select({
       id:placementApplications.id,jobId:placementApplications.jobId,
       snapshot:placementApplications.eligibilitySnapshot,
      }).from(placementApplications).innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
       .where(and(eq(placementApplications.membershipId,row.studentCode),
        eq(placementApplications.status,"SUBMITTED"),eq(placementJobs.collegeId,college.id)))
       .for("update",{of:placementApplications});
      const oldStatuses=await Promise.all(applications.map(app=>
       evaluatePlacementEligibility(context,app.jobId,row.studentCode,tx).then(result=>result.status)));
      // Omitted academic fields remain untouched in an existing verified
      // record. This is important when a TPO corrects only one marks field.
      // A single persisted VERIFIED source wins over SELF evidence during
      // placement eligibility, and source provenance remains auditable.
      const evidence = {
        ...(row.cgpa!==undefined?{cgpaHundredths:Math.round(row.cgpa*100)}:{}),
        ...(row.activeBacklogs!==undefined?{activeBacklogs:row.activeBacklogs}:{}),
        ...(row.pastBacklogs!==undefined?{pastBacklogs:row.pastBacklogs}:{}),
        ...(row.tenthPercentage!==undefined?{tenthPctBasisPoints:Math.round(row.tenthPercentage*100)}:{}),
        ...(row.twelfthPercentage!==undefined?{twelfthPctBasisPoints:Math.round(row.twelfthPercentage*100)}:{}),
        ...(row.diplomaPercentage!==undefined?{diplomaPctBasisPoints:Math.round(row.diplomaPercentage*100)}:{}),
        ...(row.undergraduatePercentage!==undefined?{undergraduatePctBasisPoints:Math.round(row.undergraduatePercentage*100)}:{}),
        ...(row.postgraduatePercentage!==undefined?{postgraduatePctBasisPoints:Math.round(row.postgraduatePercentage*100)}:{}),
        ...(row.gapYears!==undefined?{gapYears:row.gapYears}:{}),
        ...(row.isLateralEntry!==undefined?{isLateralEntry:row.isLateralEntry}:{}),
        ...(row.passingYear!==undefined?{passingYear:row.passingYear}:{}),
        source: "VERIFIED" as const,
        // Direct correction is not an import batch, even if later reached
        // from a single-row form. Imported rows have a traceable timestamp.
        importedAt: input.mode==="SINGLE"?null:now,
        sourceMetadata:{mode:input.mode,verifiedFields:Object.keys(row).filter(key=>key!=="studentCode")},
        verifiedAt: now,
        verifiedByUserId: context.user.id,
        updatedAt: now,
      };
      await tx.insert(placementCandidateAcademicEvidence)
        .values({ membershipId: row.studentCode, ...evidence })
        .onConflictDoUpdate({
          target: placementCandidateAcademicEvidence.membershipId,
          set: evidence,
        });
      await tx.insert(activityEvents).values({
        organizationId: college.organizationId, collegeId: college.id,
        actorUserId: context.user.id, actorMembershipId: context.membership!.id,
        module: "PLACEMENTS", eventType: "ACADEMIC_RECORD_IMPORTED",
        subjectType: "placement_candidate_academic_evidence", subjectId: row.studentCode,
        summary: input.mode==="SINGLE"?"Academic record corrected":"Academic record imported",
        metadata: {fields:Object.keys(row).filter(key=>key!=="studentCode"),
         mode:input.mode,source:"VERIFIED"},
      });
      for(let index=0;index<applications.length;index++){
       const application=applications[index]!;
       const current=await evaluatePlacementEligibility(context,application.jobId,row.studentCode,tx);
       if(!tpoAcademicImportNewlyIneligible(oldStatuses[index]!,current.status))continue;
       if(!application.snapshot||typeof application.snapshot!=="object"||Array.isArray(application.snapshot))
        throw new Error("ACADEMIC_IMPORT_INVALID_APPLICATION_SNAPSHOT");
       const learnerUserId=studentUsers.get(row.studentCode);
       if(!learnerUserId)throw new Error("ACADEMIC_IMPORT_MEMBER_CHANGED");
       const [flagged]=await tx.update(placementApplications).set({
        eligibilitySnapshot:{...application.snapshot,
         academicImportReview:{newlyIneligible:true,at:now.toISOString(),
          reason:"VERIFIED_ACADEMIC_EVIDENCE_CHANGED"}},
        updatedAt:now,
       }).where(and(eq(placementApplications.id,application.id),
        eq(placementApplications.membershipId,row.studentCode),
        eq(placementApplications.status,"SUBMITTED")))
        .returning({id:placementApplications.id});
       if(!flagged)throw new Error("ACADEMIC_IMPORT_APPLICATION_CHANGED");
       const [event]=await tx.insert(activityEvents).values({
        organizationId:college.organizationId,collegeId:college.id,
        actorUserId:context.user.id,actorMembershipId:context.membership!.id,
        module:"PLACEMENTS",eventType:"NOW_INELIGIBLE",
        subjectType:"placement_application",subjectId:application.id,
        summary:"Academic import flagged an existing application for eligibility review",
        metadata:{previousStatus:oldStatuses[index],nextStatus:current.status,
         jobId:application.jobId,applicationPreserved:true},
       }).returning({id:activityEvents.id});
       if(!event)throw new Error("ACADEMIC_IMPORT_NOTICE_FAILED");
       const recipients=[{
        userId:learnerUserId,eventId:event.id,title:"Placement eligibility needs review",
        body:"Your updated academic details no longer meet a drive requirement. Your existing application is still recorded. Contact the placement cell.",
        actionHref:"/learn/my-placements",
       },...staff.filter(person=>person.userId!==learnerUserId).map(person=>({
        userId:person.userId,eventId:event.id,title:"Now ineligible after academic import",
        body:"Verified academic data changed an existing applicant's eligibility. Review the affected drive application.",
        actionHref:"/tpo/requests",
       }))];
       await tx.insert(inAppNotifications).values(recipients).onConflictDoNothing();
       newlyIneligible++;
      }
      updated++;
    }
    return { updated, skipped: missing.length, unmatched: missing, newlyIneligible };
  });
}

// Single-learner manual correction uses the same scoped preview and commit
// policy as the bulk import. The calling UI must preview then confirm before
// invoking commit; the second read revalidates membership and permissions.
export async function previewTpoSingleAcademicCorrection(
 context:RequestContext,studentCode:string,
 changes:Omit<z.infer<typeof correctionRowSchema>,"studentCode">,
){
 return previewTpoAcademicImport(context,{mode:"SINGLE",rows:[{studentCode,...changes}]});
}
export async function commitTpoSingleAcademicCorrection(
 context:RequestContext,studentCode:string,
 changes:Omit<z.infer<typeof correctionRowSchema>,"studentCode">,
){
 return commitTpoAcademicImport(context,{mode:"SINGLE",rows:[{studentCode,...changes}]});
}
