import "server-only";

import {
  and,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  placementCompanyRelationships,
  placementApplicationScreenings,
  placementApplicationStatusHistory,
  placementApplications,
  placementJobRounds,
  placementJobs,
  placementOfferStatusHistory,
  placementOffers,
  placementRoundResults,
  placementTpoLeadActivities,
  placementTpoFollowups,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  FAILURE_KIND_LABELS,
  summarizePlacementFailureReasons,
  summarizePlacementLeads,
  type PlacementFailureFact,
  type PlacementFailureKind,
} from "./report-extra-model";
import {
  getPlacementReportWorkspace,
  type PlacementReportQuery,
} from "./report-service";
import { listTpoLeads } from "./tpo-crm-service";
import {buildTpoCompanyEngagement} from "./tpo-company-engagement-model";
import { summarizeTpoLeadHealth } from "./tpo-lead-health-model";

/**
 * Each selected event is joined back to its owning job
 * and same-college learner membership.
 *
 * Existing report-service resolves/authorizes the college,
 * selected season and optional drive before any new query.
 *
 * Deliberately does NOT read placement_batch_registrations
 * or placement_external_offers.
 */
export async function getPlacementFailureReasonsReport(
  context: RequestContext,
  query: PlacementReportQuery,
) {
  const workspace =
    await getPlacementReportWorkspace(context, query);

  const selectedJobs = workspace.selectedJobId
    ? workspace.jobs.filter(
        (job) => job.id === workspace.selectedJobId,
      )
    : workspace.jobs;

  if (
    !workspace.selectedSeasonId ||
    selectedJobs.length === 0
  ) {
    return {
      ...workspace,
      failures: summarizePlacementFailureReasons([]),
    };
  }

  const db = getDb();
  const jobIds = selectedJobs.map((job) => job.id);
  const jobsById = new Map(
    selectedJobs.map((job) => [job.id, job]),
  );

  const scopedJob = and(
    eq(placementJobs.collegeId, workspace.collegeId),
    eq(
      placementJobs.seasonId,
      workspace.selectedSeasonId,
    ),
    inArray(placementJobs.id, jobIds),
    isNull(placementJobs.archivedAt),
    eq(
      collegeMemberships.collegeId,
      workspace.collegeId,
    ),
  );

  const [
    screeningRows,
    roundRows,
    applicationWithdrawalRows,
    offerDecisionRows,
  ] = await Promise.all([
    db
      .select({
        id: placementApplicationScreenings.applicationId,
        jobId: placementApplications.jobId,
        internalReason:
          placementApplicationScreenings.internalReason,
        candidateMessage:
          placementApplicationScreenings.candidateMessage,
      })
      .from(placementApplicationScreenings)
      .innerJoin(
        placementApplications,
        eq(
          placementApplications.id,
          placementApplicationScreenings.applicationId,
        ),
      )
      .innerJoin(
        placementJobs,
        eq(
          placementJobs.id,
          placementApplications.jobId,
        ),
      )
      .innerJoin(
        collegeMemberships,
        eq(
          collegeMemberships.id,
          placementApplications.membershipId,
        ),
      )
      .where(
        and(
          scopedJob,
          eq(
            placementApplicationScreenings.status,
            "REJECTED",
          ),
        ),
      ),

    db
      .select({
        id: placementRoundResults.id,
        jobId: placementApplications.jobId,
        reasonCategory:
          placementRoundResults.reasonCategory,
        candidateMessage:
          placementRoundResults.candidateMessage,
      })
      .from(placementRoundResults)
      .innerJoin(
        placementJobRounds,
        eq(
          placementJobRounds.id,
          placementRoundResults.roundId,
        ),
      )
      .innerJoin(
        placementApplications,
        and(
          eq(
            placementApplications.id,
            placementRoundResults.applicationId,
          ),
          eq(
            placementApplications.jobId,
            placementJobRounds.jobId,
          ),
        ),
      )
      .innerJoin(
        placementJobs,
        eq(
          placementJobs.id,
          placementApplications.jobId,
        ),
      )
      .innerJoin(
        collegeMemberships,
        eq(
          collegeMemberships.id,
          placementApplications.membershipId,
        ),
      )
      .where(
        and(
          scopedJob,
          eq(placementRoundResults.status, "APPLIED"),
          eq(placementRoundResults.outcome, "FAIL"),
        ),
      ),

    db
      .select({
        id: placementApplicationStatusHistory.id,
        jobId: placementApplications.jobId,
        reason: placementApplicationStatusHistory.reason,
      })
      .from(placementApplicationStatusHistory)
      .innerJoin(
        placementApplications,
        eq(
          placementApplications.id,
          placementApplicationStatusHistory.applicationId,
        ),
      )
      .innerJoin(
        placementJobs,
        eq(
          placementJobs.id,
          placementApplications.jobId,
        ),
      )
      .innerJoin(
        collegeMemberships,
        eq(
          collegeMemberships.id,
          placementApplications.membershipId,
        ),
      )
      .where(
        and(
          scopedJob,
          eq(
            placementApplicationStatusHistory.toStatus,
            "WITHDRAWN",
          ),
        ),
      ),

    db
      .select({
        id: placementOfferStatusHistory.id,
        jobId: placementApplications.jobId,
        toStatus: placementOfferStatusHistory.toStatus,
        reason: placementOfferStatusHistory.reason,
      })
      .from(placementOfferStatusHistory)
      .innerJoin(
        placementOffers,
        eq(
          placementOffers.id,
          placementOfferStatusHistory.offerId,
        ),
      )
      .innerJoin(
        placementApplications,
        eq(
          placementApplications.id,
          placementOffers.applicationId,
        ),
      )
      .innerJoin(
        placementJobs,
        eq(
          placementJobs.id,
          placementApplications.jobId,
        ),
      )
      .innerJoin(
        collegeMemberships,
        eq(
          collegeMemberships.id,
          placementApplications.membershipId,
        ),
      )
      .where(
        and(
          scopedJob,
          inArray(
            placementOfferStatusHistory.toStatus,
            ["DECLINED", "WITHDRAWN"],
          ),
        ),
      ),
  ]);

  const facts: PlacementFailureFact[] = [];

  function append(
    kind: PlacementFailureKind,
    id: string,
    jobId: string,
    reason: string | null,
  ) {
    const job = jobsById.get(jobId);
    if (!job) return;

    facts.push({
      id,
      jobId,
      jobTitle: job.title,
      companyName: job.companyName,
      kind,
      reason,
    });
  }

  for (const row of screeningRows) {
    append(
      "SCREENING_REJECTED",
      row.id,
      row.jobId,
      row.internalReason?.trim() ||
        row.candidateMessage,
    );
  }

  for (const row of roundRows) {
    append(
      "ROUND_FAILED",
      row.id,
      row.jobId,
      row.reasonCategory ??
        row.candidateMessage,
    );
  }

  for (const row of applicationWithdrawalRows) {
    append(
      "APPLICATION_WITHDRAWN",
      row.id,
      row.jobId,
      row.reason,
    );
  }

  for (const row of offerDecisionRows) {
    append(
      row.toStatus === "DECLINED"
        ? "OFFER_DECLINED"
        : "OFFER_WITHDRAWN",
      row.id,
      row.jobId,
      row.reason,
    );
  }

  return {
    ...workspace,
    failures: summarizePlacementFailureReasons(facts),
    failureScopeNote:
      "This report counts persisted adverse events or current decisions, " +
      "not unique learners. Screening rejection uses the current screening " +
      "status and recorded internal reason (falling back to the candidate " +
      "message). Round failure uses currently APPLIED failed results and " +
      "their recorded reason category/message. Application withdrawals " +
      "and offer declines/withdrawals use persisted transition history. " +
      "Missing reasons are labelled explicitly. A learner can contribute " +
      "more than one event. Superseded round results are excluded.",
  };
}

/**
 * CRM leads belong to a college, not a placement season.
 * Conversion is an observed linked recruiter user, not
 * a guessed invitation success, placement or hire.
 */
export async function getPlacementLeadsReport(
  context: RequestContext,
  collegeId: string,
) {
  if (
    isSuperAdmin(context) &&
    context.adminScope?.collegeId !== collegeId
  ) {
    throw new AuthorizationError("placements.manage");
  }

  // Existing CRM read service checks placements.manage
  // against the college and returns an explicit safe view.
  const leads = await listTpoLeads(context, collegeId);
  const db = getDb();
  // Only real contact types count as outreach; NOTE/creation/SYSTEM do not.
  const [contacts, openSteps, relationships] = await Promise.all([
    db.select({ leadId: placementTpoLeadActivities.leadId,
      at: placementTpoLeadActivities.createdAt })
      .from(placementTpoLeadActivities)
      .where(and(eq(placementTpoLeadActivities.collegeId, collegeId),
        inArray(placementTpoLeadActivities.type, ["CALL", "EMAIL", "WHATSAPP", "MEETING"]))),
    db.select({ leadId: placementTpoFollowups.leadId, dueAt: placementTpoFollowups.dueAt })
      .from(placementTpoFollowups)
      .where(and(eq(placementTpoFollowups.collegeId, collegeId),
        isNull(placementTpoFollowups.doneAt))),
    db.select({relationshipId:placementCompanyRelationships.id,companyId:placementCompanyRelationships.companyId})
      .from(placementCompanyRelationships)
      .where(eq(placementCompanyRelationships.collegeId,collegeId)),
  ]);
  const health = summarizeTpoLeadHealth(
    leads.map((lead) => ({ id: lead.id, manualStage: lead.manualStage,
      ownerMembershipId: lead.ownerMembershipId, recruiterUserId: lead.recruiterUserId,
      unsubscribedAt: lead.unsubscribedAt?.toISOString() ?? null })),
    contacts.map((item) => ({ leadId: item.leadId, at: item.at.toISOString() })),
    openSteps.map((item) => ({ leadId: item.leadId, dueAt: item.dueAt.toISOString() })),
    new Date().toISOString(),
  );

  return {
    health,
    collegeId,
    companyEngagement:buildTpoCompanyEngagement(leads,contacts.map(row=>({leadId:row.leadId})))
      .map(row=>({...row,companyId:relationships.find(rel=>rel.relationshipId===row.companyRelationshipId)?.companyId??null})),
    leads: summarizePlacementLeads(
      leads.map((lead) => ({
        id: lead.id,
        manualStage: lead.manualStage,
        source: lead.source,
        invited: lead.inviteSentAt !== null,
        inviteClicked: lead.inviteClickedAt !== null,
        recruiterAccountLinked:
          lead.recruiterUserId !== null,
        companyRelationshipLinked:
          lead.companyRelationshipId !== null,
      })),
    ),
    leadScopeNote:
      "This is a college-wide CRM snapshot. Lead stages are the persisted " +
      "NEW, CONTACTED and NOT_NOW values; sources are manually recorded. " +
      "Invited/clicked counts use stored invitation timestamps. A linked " +
      "recruiter account is the measurable conversion signal here; " +
      "it does not prove hiring, a placement drive or an accepted offer. " +
      "Lead records have no persisted season/drive assignment, so those " +
      "placement-report filters do not narrow this CRM report.",
  };
}

export { FAILURE_KIND_LABELS };
