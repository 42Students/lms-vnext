import {
  and,
  asc,
  eq,
  gt,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  placementApplications,
  placementApplicationScreenings,
  placementCompanies,
  placementCompanyRelationships,
  placementJobRounds,
  placementJobs,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  placementRoundResults,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { isRecruiterJobVisible } from "./recruiter-job-visibility-model";
import { isRecruiterSharedCandidateAllowed } from "./recruiter-shared-candidate-policy";
import { PlacementsServiceError } from "./errors";
import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";
import { placementJobIdSchema } from "./validation";
import {recruiterSharedRoundParticipantEmail} from "./recruiter-round-participant-sharing";

function resultKey(
  roundId: string,
  applicationId: string,
) {
  return roundId + ":" + applicationId;
}

export async function getRecruiterPlacementWorkspace(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId =
    placementJobIdSchema.parse(jobIdInput);

  const [scope] = await getDb()
    .select({
      job: placementJobs,
      relationshipId:
        placementCompanyRelationships.id,
      shareColumnDefaults: placementCompanyRelationships.shareColumnDefaults,
      companyId: placementCompanies.id,
      companyName: placementCompanies.name,
      collegeId:
        placementCompanyRelationships.collegeId,
      collegeName: colleges.name,
    })
    .from(placementJobs)
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .innerJoin(
      colleges,
      eq(
        colleges.id,
        placementJobs.collegeId,
      ),
    )
    // HR-GRANT-EXPIRE-39: a cached session grant never bypasses persisted
    // verification, validity and DRIVES capability before candidate reads.
    .innerJoin(placementRecruiterProfiles,and(
      eq(placementRecruiterProfiles.userId,context.user.id),
      eq(placementRecruiterProfiles.companyId,placementCompanies.id),
      eq(placementRecruiterProfiles.status,"ACTIVE"),
    ))
    .innerJoin(placementRecruiterCollegeGrants,and(
      eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
      eq(placementRecruiterCollegeGrants.companyRelationshipId,placementCompanyRelationships.id),
      eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
      eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
      gt(placementRecruiterCollegeGrants.validUntil,sql`now()`),
      sql<boolean>`'DRIVES' = ANY(${placementRecruiterCollegeGrants.capabilities})`,
    ))
    .where(
      and(
        eq(placementJobs.id, jobId),
        recruiterOwnJobPredicate(context.user.id),
        eq(placementCompanyRelationships.status, "ACTIVE"),
        eq(placementCompanies.status, "ACTIVE"),
        eq(colleges.status, "ACTIVE"),
        eq(
          placementCompanyRelationships.collegeId,
          placementJobs.collegeId,
        ),
      ),
    )
    .limit(1);

  if (
    !scope ||
    (scope.job.status !== "PUBLISHED" &&
      scope.job.status !== "CLOSED") ||
    scope.job.archivedAt !== null
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_NOT_FOUND",
    );
  }

  if (!isRecruiterJobVisible(context, scope.job.collegeId, scope.relationshipId) ||
      !can(context, "placements.recruiter.read", {
        collegeId: scope.job.collegeId,
        placementCompanyRelationshipId: scope.relationshipId,
      }) || context.recruiter?.companyId !== scope.companyId) {
    // Intentionally indistinguishable from a nonexistent or unpublished job.
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  }

  const db = getDb();
  const [rounds, candidates, resultRows] =
    await Promise.all([
      db
        .select()
        .from(placementJobRounds)
        .where(
          and(
            eq(
              placementJobRounds.jobId,
              scope.job.id,
            ),
            ne(
              placementJobRounds.status,
              "CANCELLED",
            ),
          ),
        )
        .orderBy(
          asc(placementJobRounds.sequence),
          asc(placementJobRounds.createdAt),
        ),
      db
        .select({
          applicationId:
            placementApplications.id,
          displayName: users.displayName,
          email: users.email,
          applicationStatus: placementApplications.status,
          screeningStatus: placementApplicationScreenings.status,
          membershipStatus: collegeMemberships.status,
          membershipCollegeId: collegeMemberships.collegeId,
          platformStatus: users.platformStatus,
        })
        .from(placementApplications)
        .innerJoin(
          placementApplicationScreenings,
          eq(
            placementApplicationScreenings.applicationId,
            placementApplications.id,
          ),
        )
        .innerJoin(
          collegeMemberships,
          eq(
            collegeMemberships.id,
            placementApplications.membershipId,
          ),
        )
        .innerJoin(
          users,
          eq(
            users.id,
            collegeMemberships.userId,
          ),
        )
        .where(
          and(
            eq(
              placementApplications.jobId,
              scope.job.id,
            ),
            eq(
              placementApplications.status,
              "SUBMITTED",
            ),
            eq(
              placementApplicationScreenings.status,
              "SHORTLISTED",
            ),
            eq(
              collegeMemberships.status,
              "ACTIVE",
            ),
            eq(
              collegeMemberships.collegeId,
              scope.job.collegeId,
            ),
            eq(users.platformStatus, "ACTIVE"),
          ),
        )
        .orderBy(
          asc(
            placementApplications.submittedAt,
          ),
        ),
      db
        .select({
          id: placementRoundResults.id,
          roundId:
            placementRoundResults.roundId,
          applicationId:
            placementRoundResults.applicationId,
          status:
            placementRoundResults.status,
          outcome:
            placementRoundResults.outcome,
          waitlistRank:
            placementRoundResults.waitlistRank,
          scorePercent:
            placementRoundResults.scorePercent,
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
        .where(
          and(
            eq(
              placementJobRounds.jobId,
              scope.job.id,
            ),
            ne(
              placementRoundResults.status,
              "SUPERSEDED",
            ),
          ),
        ),
    ]);

  const currentResults = new Map(
    resultRows.map((result) => [
      resultKey(
        result.roundId,
        result.applicationId,
      ),
      result,
    ]),
  );

  const visibleCandidates = candidates.filter(candidate =>
    isRecruiterSharedCandidateAllowed({
      companyId: context.recruiter?.companyId ?? null,
      jobCompanyId: scope.companyId,
      jobCollegeId: scope.job.collegeId,
      membershipCollegeId: candidate.membershipCollegeId,
      applicationStatus: candidate.applicationStatus,
      screeningStatus: candidate.screeningStatus,
      membershipStatus: candidate.membershipStatus,
      userPlatformStatus: candidate.platformStatus,
    }),
  );
  const gatingRoundIds: string[] = [];
  const roundViews = rounds.map((round) => {
    const participants = visibleCandidates.filter(
      (candidate) =>
        gatingRoundIds.every(
          (previousRoundId) => {
            const previous =
              currentResults.get(
                resultKey(
                  previousRoundId,
                  candidate.applicationId,
                ),
              );
            return (
              previous?.status === "APPLIED" &&
              previous.outcome === "PASS"
            );
          },
        ),
    );

    const view = {
      id: round.id,
      sequence: round.sequence,
      kind: round.kind,
      name: round.name,
      status: round.status,
      createdByUserId: round.createdByUserId,
      updatedAt: round.updatedAt,
      scheduledAt: round.scheduledAt,
      timezone: round.timezone,
      mode: round.mode,
      venue: round.venue,
      meetingUrl: round.meetingUrl,
      whatToBring: round.whatToBring,
      platform: round.platform,
      testUrl: round.testUrl,
      durationMinutes:
        round.durationMinutes,
      resultsDueAt: round.resultsDueAt,
      participants: participants.map(
        (candidate) => ({
          applicationId:
            candidate.applicationId,
          displayName:
            candidate.displayName,
          email: recruiterSharedRoundParticipantEmail(candidate.email, scope.shareColumnDefaults),
          result:
            currentResults.get(
              resultKey(
                round.id,
                candidate.applicationId,
              ),
            ) ?? null,
        }),
      ),
    };

    if (round.kind !== "TALK") {
      gatingRoundIds.push(round.id);
    }
    return view;
  });

  const grant =
    context.recruiter?.grants.find(
      (item) =>
        item.collegeId ===
          scope.job.collegeId &&
        item.companyRelationshipId ===
          scope.relationshipId,
    ) ?? null;

  return {
    job: {
      id: scope.job.id,
      companyRelationshipId: scope.relationshipId,
      title: scope.job.title,
      description:
        scope.job.description,
      status: scope.job.status,
      employmentType:
        scope.job.employmentType,
      workMode: scope.job.workMode,
      locations: scope.job.locations,
      openings: scope.job.openings,
      minimumAnnualCtcInr:
        scope.job.minimumAnnualCtcInr,
      maximumAnnualCtcInr:
        scope.job.maximumAnnualCtcInr,
      applicationDeadline:
        scope.job.applicationDeadline,
      recruiterDriveMode: scope.job.recruiterDriveMode,
      eligibleBranches: scope.job.eligibleBranches,
      eligiblePassingYear: scope.job.eligiblePassingYear,
      ctcLpa: scope.job.ctcLpa,
      fixedCtcLpa: scope.job.fixedCtcLpa,
      variableCtcLpa: scope.job.variableCtcLpa,
      stipendPerMonthInr: scope.job.stipendPerMonthInr,
    },
    company: {
      id: scope.companyId,
      name: scope.companyName,
    },
    college: {
      id: scope.job.collegeId,
      name:
        grant?.collegeName ??
        scope.collegeName,
    },
    rounds: roundViews,
  };
}
