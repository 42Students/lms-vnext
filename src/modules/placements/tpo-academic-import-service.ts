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

const schema = z.object({
  rows: z.array(tpoAcademicPreviewRowSchema).min(1).max(200),
  skipUnmatched: z.boolean().default(false),
}).strict();
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
        eq(placementApplications.status,"SUBMITTED"),eq(placementJobs.collegeId,college.id)));
      const oldStatuses=await Promise.all(applications.map(app=>
       evaluatePlacementEligibility(context,app.jobId,row.studentCode,tx).then(result=>result.status)));
      const evidence = {
        cgpaHundredths: Math.round(row.cgpa * 100),
        activeBacklogs: row.activeBacklogs,
        source: "VERIFIED" as const,
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
        summary: "Academic record imported",
        metadata: { cgpa: row.cgpa, activeBacklogs: row.activeBacklogs },
      });
      for(let index=0;index<applications.length;index++){
       const application=applications[index]!;
       const current=await evaluatePlacementEligibility(context,application.jobId,row.studentCode,tx);
       if(!tpoAcademicImportNewlyIneligible(oldStatuses[index]!,current.status))continue;
       if(!application.snapshot||typeof application.snapshot!=="object"||Array.isArray(application.snapshot))
        throw new Error("ACADEMIC_IMPORT_INVALID_APPLICATION_SNAPSHOT");
       const learnerUserId=studentUsers.get(row.studentCode);
       if(!learnerUserId)throw new Error("ACADEMIC_IMPORT_MEMBER_CHANGED");
       await tx.update(placementApplications).set({
        eligibilitySnapshot:{...application.snapshot,
         academicImportReview:{newlyIneligible:true,at:now.toISOString(),
          reason:"VERIFIED_ACADEMIC_EVIDENCE_CHANGED"}},
        updatedAt:now,
       }).where(and(eq(placementApplications.id,application.id),
        eq(placementApplications.membershipId,row.studentCode)));
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
