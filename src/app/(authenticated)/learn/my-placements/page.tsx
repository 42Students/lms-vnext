import Link from "next/link";
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
import { LearnerPlacementsDashboard } from "@/components/placements/learner-placements-dashboard";
import { LearnerPlacementPartialAlert } from "@/components/placements/learner-placement-partial-alert";
import { learnerDashboardPartialState, type PlacementDashboardAvailability }
  from "@/modules/placements/learner-dashboard-partial-model";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { LearnerRecentPlacementActivity } from "@/components/placements/learner-recent-placement-activity";
import { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";
import {getOwnLearnerPlacementGreeting} from "@/modules/placements/learner-dashboard-greeting-service";
import {learnerPlacementApplicationFunnel} from "@/modules/placements/learner-dashboard-funnel-model";
import { LearnerPlacementRequests } from "@/components/placements/learner-placement-requests";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { getOwnAcademicEvidence } from "@/modules/placements/eligibility-service";
import { getLearnerPlacementJourneyWithActivity } from "@/modules/placements/learner-recent-placement-activity-service";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import { listOwnPlacementOffers } from "@/modules/placements/offer-service";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";

export default async function LearnerPlacementsPage({
  searchParams,
}: {
  searchParams: Promise<{ requestRoundId?: string | string[] }>;
}) {
  const query = await searchParams;
  const requestRoundId = typeof query.requestRoundId === "string"
    ? query.requestRoundId
    : null;
  const context =
    await getCurrentRequestContext();
  if (!hasMembershipRole(context, "LEARNER")) {
    redirect("/dashboard");
  }

  // Authorization failures cannot be reduced to a "partially loaded" page.
  const ownMembership=await requireLearnerPlacementAccess(context);
  requirePermission(context,"placements.read",{
    collegeId:ownMembership.collegeId,organizationId:ownMembership.organizationId,
  });
  const [jobsRead,preferencesRead,journeyRead,academicRead,offersRead,requestsRead] =
    await Promise.allSettled([
      listLearnerPlacementJobs(context),getCandidatePreferences(context),
      getLearnerPlacementJourneyWithActivity(context),getOwnAcademicEvidence(context),
      listOwnPlacementOffers(context),getLearnerPlacementRequestWorkspace(context),
    ]);
  // Never turn a post-preflight authorization revocation into a partial read:
  // the entire page must deny access, even when other source calls succeeded.
  for(const outcome of [jobsRead,preferencesRead,journeyRead,academicRead,offersRead,requestsRead]){
    if(outcome.status==="rejected" && outcome.reason instanceof AuthorizationError)
      throw outcome.reason;
  }
  const availability:PlacementDashboardAvailability={
    jobs:jobsRead.status==="fulfilled",preferences:preferencesRead.status==="fulfilled",
    journey:journeyRead.status==="fulfilled",academic:academicRead.status==="fulfilled",
    offers:offersRead.status==="fulfilled",rounds:requestsRead.status==="fulfilled",
  };
  const rows=jobsRead.status==="fulfilled"?jobsRead.value:null;
  const preferences=preferencesRead.status==="fulfilled"?preferencesRead.value:null;
  const journeyBundle=journeyRead.status==="fulfilled"?journeyRead.value:null;
  const academicEvidence=academicRead.status==="fulfilled"?academicRead.value:null;
  const offerRows=offersRead.status==="fulfilled"?offersRead.value:null;
  const requestWorkspace=requestsRead.status==="fulfilled"?requestsRead.value:null;
  const journeyRows=journeyBundle?.rows ?? [];


  const items: LearnerPlacementJobItem[] =
    (rows ?? []).map((row) => ({
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
      jobId: row.job.id,
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

  const dashboard = learnerPlacementDashboard({
    jobs: (rows ?? []).map((row) => ({
      jobId: row.job.id,
      deadlinePassed: row.deadlinePassed,
      canApply: row.canApply,
    })),
    applications: journeyRows.map((row) => ({
      applicationId: row.applicationId,
      applicationStatus: row.applicationStatus,
      screeningStatus: row.screening.status,
    })),
    rounds: (requestWorkspace?.rounds ?? []).map((row) => ({
      applicationId: row.applicationId,
      roundId: row.roundId,
      roundKind: row.roundKind,
      roundName: row.roundName,
      companyName: row.companyName,
      roleTitle: row.roleTitle,
      scheduledAt: row.scheduledAt,
      exception: row.exception
        ? { scheduledAt: row.exception.scheduledAt }
        : null,
    })),
    offers: (offerRows ?? []).map((row) => ({
      status: row.offer.status,
      expiresAt: row.offer.expiresAt,
    })),
  });

  const display=learnerDashboardPartialState(availability,dashboard);
  const applicationFunnel=journeyBundle ? learnerPlacementApplicationFunnel(journeyRows) : null;
  const learnerName=await getOwnLearnerPlacementGreeting(context).catch(error=>{
    if(error instanceof AuthorizationError)throw error;
    return null;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Learner"
        title="My Placements"
        description="Your placement dashboard, applications, assessments, interviews and career activity."
      />

      <div className="flex flex-wrap gap-3">
        <Link href="/learn/my-placements/preparation"
          className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
          Placement preparation checklist →
        </Link>
        <Link href="/learn/my-placements/notification-preferences"
          className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
          Placement notification choices →
        </Link>
      </div>

      <LearnerPlacementPartialAlert missing={display.failed} />
      <LearnerPlacementsDashboard snapshot={dashboard} availability={availability} learnerName={learnerName} applicationFunnel={applicationFunnel} />

      {journeyBundle ? <LearnerRecentPlacementActivity events={journeyBundle.activity} /> : null}

      {offerRows ? <LearnerPlacementOffers
        snapshotNowIso={new Date().toISOString()}
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
      /> : null}

      {requestWorkspace ? <LearnerPlacementRequests
        initialRoundId={requestRoundId}
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
      /> : null}

      {journeyBundle ? <LearnerPlacementJourney items={journey} /> : null}

      {availability.academic ? <LearnerPlacementAcademicEvidence
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
      /> : null}

      {preferences ? <LearnerPlacementPreferences
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
      /> : null}

      {rows ? <section className="space-y-3">
        <div>
          <h2 className="m-0 text-base font-semibold text-foreground">
            Live opportunities
          </h2>
          <p className="mt-1 text-sm text-body">
            Published jobs for your college with explainable eligibility and exact application state.
          </p>
        </div>
        <LearnerPlacementJobs items={items} />
      </section> : null}
    </div>
  );
}
