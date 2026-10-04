import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerPlacementAcademicEvidence } from "@/components/placements/learner-placement-academic-evidence";
import {
  LearnerPlacementJobs,
  type LearnerPlacementJobItem,
} from "@/components/placements/learner-placement-jobs";
import {
  LearnerPlacementJourney,
  type LearnerPlacementJourneyItem,
} from "@/components/placements/learner-placement-journey";
import { LearnerPlacementPreferences } from "@/components/placements/learner-placement-preferences";
import { LearnerPlacementOffers } from "@/components/placements/learner-placement-offers";
import { LearnerPlacementRequests } from "@/components/placements/learner-placement-requests";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { getOwnAcademicEvidence } from "@/modules/placements/eligibility-service";
import { getLearnerPlacementJourney } from "@/modules/placements/learner-journey-service";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import { listOwnPlacementOffers } from "@/modules/placements/offer-service";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";

export default async function LearnerPlacementsPage() {
  const context =
    await getCurrentRequestContext();
  if (!hasMembershipRole(context, "LEARNER")) {
    redirect("/dashboard");
  }

  const [
    rows,
    preferences,
    journeyRows,
    academicEvidence,
    offerRows,
    requestWorkspace,
  ] = await Promise.all([
    listLearnerPlacementJobs(context),
    getCandidatePreferences(context),
    getLearnerPlacementJourney(context),
    getOwnAcademicEvidence(context),
    listOwnPlacementOffers(context),
    getLearnerPlacementRequestWorkspace(context),
  ]);

  const items: LearnerPlacementJobItem[] =
    rows.map((row) => ({
      job: {
        id: row.job.id,
        title: row.job.title,
        description: row.job.description,
        employmentType:
          row.job.employmentType,
        workMode: row.job.workMode,
        locations: row.job.locations,
        openings: row.job.openings,
        minimumAnnualCtcInr:
          row.job.minimumAnnualCtcInr,
        maximumAnnualCtcInr:
          row.job.maximumAnnualCtcInr,
        applicationMode:
          row.job.applicationMode,
        externalApplicationUrl:
          row.job.externalApplicationUrl,
        applicationDeadline:
          row.job.applicationDeadline?.toISOString() ??
          null,
      },
      roleOption: {
        id: row.roleOption.id,
        title: row.roleOption.title,
        employmentType:
          row.roleOption.employmentType,
        workMode: row.roleOption.workMode,
        locations: row.roleOption.locations,
        openings: row.roleOption.openings,
        minimumAnnualCtcInr:
          row.roleOption.minimumAnnualCtcInr,
        maximumAnnualCtcInr:
          row.roleOption.maximumAnnualCtcInr,
        isPrimary:
          row.roleOption.isPrimary,
      },
      company: row.company,
      application: row.application
        ? {
            ...row.application,
            submittedAt:
              row.application.submittedAt.toISOString(),
            withdrawnAt:
              row.application.withdrawnAt?.toISOString() ??
              null,
          }
        : null,
      eligibility: row.eligibility,
      deadlinePassed: row.deadlinePassed,
      canApply: row.canApply,
    }));

  const journey: LearnerPlacementJourneyItem[] =
    journeyRows.map((row) => ({
      applicationId: row.applicationId,
      jobTitle: row.job.title,
      companyName: row.company.name,
      applicationStatus:
        row.applicationStatus,
      channel: row.channel,
      submittedAt: row.submittedAt,
      withdrawnAt: row.withdrawnAt,
      screening: row.screening,
      results: row.results.map(
        (result) => ({
          resultId: result.resultId,
          roundSequence:
            result.roundSequence,
          roundName: result.roundName,
          outcome: result.outcome,
          scorePercent:
            result.scorePercent,
          candidateMessage:
            result.candidateMessage,
          appliedAt: result.appliedAt,
        }),
      ),
    }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Learner"
        title="Placements"
        description="Your placement journey, preferences and live college opportunities in one workspace."
      />

      <LearnerPlacementOffers
        offers={offerRows.map((row) => ({
          offerId: row.offer.id,
          applicationId:
            row.offer.applicationId,
          companyName:
            row.company.name,
          jobTitle: row.job.title,
          roleTitle:
            row.offer.roleTitle,
          status:
            row.offer.status as
              | "ISSUED"
              | "ACCEPTED"
              | "DECLINED"
              | "WITHDRAWN",
          annualCtcInr:
            row.offer.annualCtcInr,
          joiningDate:
            row.offer.joiningDate,
          expiresAt:
            row.offer.expiresAt?.toISOString() ??
            null,
          issuedAt:
            row.offer.issuedAt.toISOString(),
          joining: row.joining
            ? {
                status:
                  row.joining.status as
                    | "PENDING"
                    | "JOINED"
                    | "DID_NOT_JOIN"
                    | "DEFERRED",
                joiningDate:
                  row.joining.joiningDate,
                reason:
                  row.joining.reason,
              }
            : null,
        }))}
      />

      <LearnerPlacementRequests
        requests={requestWorkspace.requests.map(
          (row) => ({
            id: row.request.id,
            requestType:
              row.request.requestType as
                | "APPLICATION_WITHDRAWAL"
                | "ROUND_RESCHEDULE"
                | "OFFER_EXTENSION",
            status:
              row.request.status as
                | "PENDING"
                | "APPROVED"
                | "REJECTED"
                | "CANCELLED",
            reason: row.request.reason,
            decisionNote:
              row.request.decisionNote,
            requestedAt:
              row.request.requestedAt.toISOString(),
            decidedAt:
              row.request.decidedAt?.toISOString() ??
              null,
            roleTitle:
              row.roleOption.title,
            jobTitle: row.job.title,
            companyName: row.company.name,
            roundName:
              row.round?.name ?? null,
            offerRoleTitle:
              row.offer?.roleTitle ?? null,
            effectPayload:
              (row.request.effectPayload ??
                {}) as Record<
                string,
                unknown
              >,
          }),
        )}
        rounds={requestWorkspace.rounds.map(
          (row) => ({
            applicationId:
              row.applicationId,
            roundId: row.roundId,
            roundName: row.roundName,
            sequence: row.sequence,
            roleTitle: row.roleTitle,
            companyName:
              row.companyName,
            scheduledAt:
              row.scheduledAt?.toISOString() ??
              null,
            timezone: row.timezone,
            mode: row.mode,
            venue: row.venue,
            meetingUrl: row.meetingUrl,
            exception: row.exception
              ? {
                  scheduledAt:
                    row.exception.scheduledAt.toISOString(),
                  timezone:
                    row.exception.timezone,
                  mode:
                    row.exception.mode,
                  venue:
                    row.exception.venue,
                  meetingUrl:
                    row.exception.meetingUrl,
                }
              : null,
          }),
        )}
        offers={requestWorkspace.offers.map(
          (row) => ({
            ...row,
            expiresAt:
              row.expiresAt?.toISOString() ??
              null,
          }),
        )}
      />

      <LearnerPlacementJourney
        items={journey}
      />

      <LearnerPlacementAcademicEvidence
        evidence={{
          cgpa:
            academicEvidence?.cgpa ?? null,
          activeBacklogs:
            academicEvidence?.activeBacklogs ??
            null,
          pastBacklogs:
            academicEvidence?.pastBacklogs ??
            null,
          tenthPercentage:
            academicEvidence?.tenthPercentage ??
            null,
          twelfthPercentage:
            academicEvidence?.twelfthPercentage ??
            null,
          diplomaPercentage:
            academicEvidence?.diplomaPercentage ??
            null,
          undergraduatePercentage:
            academicEvidence?.undergraduatePercentage ??
            null,
          gapYears:
            academicEvidence?.gapYears ?? null,
          isLateralEntry:
            academicEvidence?.isLateralEntry ??
            false,
          passingYear:
            academicEvidence?.passingYear ?? null,
          source:
            (academicEvidence?.source as
              | "SELF"
              | "VERIFIED"
              | undefined) ?? null,
        }}
      />

      <LearnerPlacementPreferences
        preferences={{
          preferredRoleTitles:
            preferences.preferredRoleTitles,
          preferredLocations:
            preferences.preferredLocations,
          preferredEmploymentTypes:
            preferences.preferredEmploymentTypes,
          preferredWorkMode:
            preferences.preferredWorkMode,
          shiftPreference:
            preferences.shiftPreference,
          minimumAnnualCtcInr:
            preferences.minimumAnnualCtcInr,
          relocationPreference:
            preferences.relocationPreference,
          notifyMatchingJobs:
            preferences.notifyMatchingJobs,
          notifyApplicationUpdates:
            preferences.notifyApplicationUpdates,
        }}
      />

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-base font-semibold text-foreground">
            Live opportunities
          </h2>
          <p className="mt-1 text-sm text-body">
            Published jobs for your college with explainable eligibility and exact application state.
          </p>
        </div>
        <LearnerPlacementJobs items={items} />
      </section>
    </div>
  );
}
