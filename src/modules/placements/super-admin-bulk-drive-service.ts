import "server-only";
import { and, count, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { placementApplications, placementCompanyRelationships, placementJobs,
  placementOffers, placementSeasons } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { AuthorizationError } from "@/modules/permissions/policy";
import { closePlacementJob } from "./job-service";
import { PlacementsServiceError } from "./errors";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";

const inputSchema = z.strictObject({
  action: z.enum(["OPEN", "CLOSE"]),
  // A legacy page can select up to 100 drives; each write is still scoped, audited and atomic.
  jobIds: z.array(z.uuid()).min(1).max(100).refine(ids => new Set(ids).size === ids.length),
});
const commitSchema = inputSchema.extend({confirmed: z.literal(true)});

async function scopedCollege(context: RequestContext) {
  if (!isSuperAdmin(context)) throw new AuthorizationError("placements.manage");
  return resolveActingCollege(context, "placements.manage");
}

export async function previewSuperAdminBulkDrives(context: RequestContext, raw: unknown) {
  const input = inputSchema.parse(raw);
  const acting = await scopedCollege(context);
  const rows = await getDb().select({
    id: placementJobs.id, title: placementJobs.title, status: placementJobs.status,
  }).from(placementJobs).where(and(eq(placementJobs.collegeId, acting.collegeId),
    inArray(placementJobs.id, input.jobIds)));
  const eligible = rows.filter(row => input.action === "CLOSE"
    ? row.status === "PUBLISHED" : row.status === "CLOSED");
  const offers = eligible.length && input.action === "CLOSE"
    ? await getDb().select({id: placementOffers.id}).from(placementOffers)
      .innerJoin(placementApplications,
        eq(placementApplications.id, placementOffers.applicationId))
      .where(and(inArray(placementApplications.jobId, eligible.map(row => row.id)),
        eq(placementOffers.status, "ISSUED"))) : [];
  const eligibleIds=eligible.map(row=>row.id);
  const [applicationCount,interviewCount]=eligibleIds.length&&input.action==="CLOSE"
    ?await Promise.all([
      getDb().select({total:count()}).from(placementApplications)
        .where(inArray(placementApplications.jobId,eligibleIds)),
      getDb().select({total:count()}).from(placementRoundCandidateSlots)
        .where(inArray(placementRoundCandidateSlots.jobId,eligibleIds)),
    ]):[[{total:0}],[{total:0}]];
  return {requested: input.jobIds.length, eligible: eligible.length,
    ignored: rows.length - eligible.length, excluded: input.jobIds.length - rows.length,
    pendingLettersWithdrawn: offers.length,
    recordedApplications:applicationCount[0]?.total??0,
    recordedInterviews:interviewCount[0]?.total??0,
    chunkSize:25,chunkCount:Math.ceil(input.jobIds.length/25),
     actionDescription:input.action==="CLOSE"
      ?"Close prevents new applications, preserves applications and interview history, withdraws issued offers, and records learner notifications. It does not delete the drive."
      :"Reopen permits new applications; previously withdrawn offers are not restored.",
    rows};
}

/** No membership cookie required; fully qualified write with an explicit selected college. */
async function reopenSuperAdminDrive(context: RequestContext, jobId: string) {
  const acting = await scopedCollege(context);
  return getDb().transaction(async tx => {
    await assertPersistedPlatformPermission(tx, context, "placements.manage", {
      organizationId: acting.organizationId, collegeId: acting.collegeId,
    });
    const [job] = await tx.select().from(placementJobs).where(and(
      eq(placementJobs.id, jobId), eq(placementJobs.collegeId, acting.collegeId),
    )).for("update").limit(1);
    if (!job || job.status !== "CLOSED") throw new Error("Drive is no longer closed");
    const [season] = await tx.select({id: placementSeasons.id}).from(placementSeasons)
      .where(and(eq(placementSeasons.id, job.seasonId),
        eq(placementSeasons.collegeId, acting.collegeId),
        eq(placementSeasons.status, "ACTIVE"))).limit(1);
    const [relationship] = await tx.select({id: placementCompanyRelationships.id})
      .from(placementCompanyRelationships).where(and(
        eq(placementCompanyRelationships.id, job.companyRelationshipId),
        eq(placementCompanyRelationships.collegeId, acting.collegeId),
        eq(placementCompanyRelationships.status, "ACTIVE"))).limit(1);
    if (!season || !relationship) throw new Error("Season or company is no longer active");
    const [updated] = await tx.update(placementJobs).set({
      status: "PUBLISHED", closedAt: null, updatedAt: new Date(),
    }).where(and(eq(placementJobs.id, jobId),
      eq(placementJobs.collegeId, acting.collegeId),
      eq(placementJobs.status, "CLOSED"))).returning({id: placementJobs.id});
    if (!updated) throw new Error("Drive changed while you were working");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_REOPENED,
      collegeId: acting.collegeId, organizationId: acting.organizationId,
      subjectType: "placement_job", subjectId: jobId, subjectLabel: job.title,
      summary: "Super Admin reopened a placement drive",
      metadata: {previousStatus: "CLOSED", newStatus: "PUBLISHED",
        withdrawnOffersNotRestored: true},
    });
    return updated;
  });
}

export async function updateSuperAdminBulkDrives(context: RequestContext, raw: unknown) {
  const input = commitSchema.parse(raw);
  const preview = await previewSuperAdminBulkDrives(context, {
    action: input.action, jobIds: input.jobIds,
  });
  const allowed = new Set(preview.rows.filter(row => input.action === "CLOSE"
    ? row.status === "PUBLISHED" : row.status === "CLOSED").map(row => row.id));
  const results: {jobId: string; status: "UPDATED" | "SKIPPED"; reason: string}[] = [];
  // Callers retry only SKIPPED IDs after another preview; every job retains
  // its own authorization, state check and audit event.
  for(let start=0;start<input.jobIds.length;start+=25){
   for(const jobId of input.jobIds.slice(start,start+25)){
    if (!allowed.has(jobId)) {
      results.push({jobId, status: "SKIPPED",
        reason: "Drive unavailable or not in the required status. Refresh and retry."});
      continue;
    }
    try {
      if (input.action === "CLOSE") await closePlacementJob(context, jobId);
      else await reopenSuperAdminDrive(context, jobId);
      results.push({jobId, status: "UPDATED", reason: "Updated"});
    } catch (error) {
      const reason=error instanceof PlacementsServiceError
        ?error.code==="PLACEMENT_JOB_NOT_CLOSABLE"
          ?"Drive status changed or unreleased selections remain; resolve them and retry this drive."
          :error.code==="PLACEMENT_SEASON_NOT_ACTIVE"
            ?"The placement season is inactive. Update the season before reopening this drive."
            :"This drive could not pass placement validation. Review its details, then retry."
        :"Could not update this drive. Refresh and retry.";
      results.push({jobId,status:"SKIPPED",reason});
    }
   }
  }
  return {requested:input.jobIds.length,chunkSize:25,
    chunkCount:Math.ceil(input.jobIds.length/25),
    updated: results.filter(row => row.status === "UPDATED").length,
    skipped: results.filter(row => row.status === "SKIPPED").length, results};
}
