import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementApplicationScreenings,
  placementCompanyRelationships,
  placementCompanies,
  placementJobRoleOptions,
  placementJobRounds,
  placementRoundCandidateSlots,
  placementJobs,
  placementOffers,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listOwnAppliedPlacementResults } from "./result-service";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import {learnerStaffApplicationOptOut} from "./learner-staff-application-optout-model";

function requireLearner(context: RequestContext) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    throw new AuthorizationError("placements.read");
  }
  return context.membership;
}

export async function getLearnerPlacementJourney(
  context: RequestContext,
) {
  const membership = requireLearner(context);
  await requireLearnerPlacementAccess(context);

  const [applications, results, offers] =
    await Promise.all([
      getDb()
        .select({
          application: placementApplications,
          screening:
            placementApplicationScreenings,
          job: {
            id: placementJobs.id,
            title:
              placementJobRoleOptions.title,
            driveTitle: placementJobs.title,
            driveStatus: placementJobs.status,
            closedAt: placementJobs.closedAt,
            employmentType:placementJobs.employmentType,
            jobTypeLabel:placementJobs.jobTypeLabel,
            recordedOutside:placementJobs.recordedOutside,
            workMode:placementJobs.workMode,
            locations:placementJobs.locations,
            applicationDeadline:placementJobs.applicationDeadline,
            minimumAnnualCtcInr:placementJobs.minimumAnnualCtcInr,
            maximumAnnualCtcInr:placementJobs.maximumAnnualCtcInr,
            ctcLpa:placementJobs.ctcLpa,
            stipendPerMonthInr:placementJobs.stipendPerMonthInr,
            isDream:placementJobs.isDream,
            legacyPostingDetails:placementJobs.legacyPostingDetails,
          },
          company: {
            id: placementCompanies.id,
            name: placementCompanies.name,
          },
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
          placementJobs,
          eq(
            placementJobs.id,
            placementApplications.jobId,
          ),
        )
        .innerJoin(
          placementJobRoleOptions,
          eq(
            placementJobRoleOptions.id,
            placementApplications.roleOptionId,
          ),
        )
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
        .where(
          eq(
            placementApplications.membershipId,
            membership.id,
          ),
        )
        .orderBy(
          desc(
            placementApplications.submittedAt,
          ),
        ),
      listOwnAppliedPlacementResults(context),
      getDb().select({
        applicationId: placementApplications.id,
        status: placementOffers.status,
        id: placementOffers.id,
        version:placementOffers.version,
        roleTitle:placementOffers.roleTitle,
        issuedAt:placementOffers.issuedAt,
        releasedAt:placementOffers.releasedAt,
        expiresAt:placementOffers.expiresAt,
        annualCtcInr:placementOffers.annualCtcInr,
      }).from(placementOffers)
        .innerJoin(placementApplications,
          eq(placementApplications.id, placementOffers.applicationId))
        .innerJoin(placementJobs,
          eq(placementJobs.id, placementApplications.jobId))
        .where(and(
          eq(placementApplications.membershipId, membership.id),
          eq(placementJobs.collegeId, membership.collegeId),
          eq(placementOffers.kind, "OFFER"),
          inArray(placementOffers.status, ["ISSUED", "ACCEPTED",
            "DECLINED", "EXPIRED", "WITHDRAWN"]),
          // A draft/verified-but-not-released offer must never leak into a
          // learner journey merely because its status is still ISSUED.
          isNotNull(placementOffers.releasedAt),
        )),
    ]);

  const [bookings, roundCatalog] = await Promise.all([
    getDb().select({
      applicationId:placementApplications.id,
      jobId:placementJobs.id,
      roundId:placementJobRounds.id,
      roundName:placementJobRounds.name,
      roundSequence:placementJobRounds.sequence,
      startsAt:placementRoundCandidateSlots.startsAt,
      endsAt:placementRoundCandidateSlots.endsAt,
      room:placementRoundCandidateSlots.room,
      panel:placementRoundCandidateSlots.panel,
      learnerConfirmedAt:placementRoundCandidateSlots.learnerConfirmedAt,
    }).from(placementRoundCandidateSlots)
     .innerJoin(placementApplications,
       eq(placementApplications.id,placementRoundCandidateSlots.applicationId))
     .innerJoin(placementJobs,
       eq(placementJobs.id,placementApplications.jobId))
     .innerJoin(placementJobRounds,and(
       eq(placementJobRounds.id,placementRoundCandidateSlots.roundId),
       eq(placementJobRounds.jobId,placementJobs.id)))
     .where(and(
       eq(placementApplications.membershipId,membership.id),
       eq(placementJobs.collegeId,membership.collegeId),
       eq(placementRoundCandidateSlots.status,"BOOKED"),
     )).orderBy(asc(placementRoundCandidateSlots.startsAt)),
    getDb().select({
      id:placementJobRounds.id,
      jobId:placementJobRounds.jobId,
      sequence:placementJobRounds.sequence,
      kind:placementJobRounds.kind,
      name:placementJobRounds.name,
      status:placementJobRounds.status,
      scheduledAt:placementJobRounds.scheduledAt,
      venue:placementJobRounds.venue,
    }).from(placementJobRounds)
     .innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
     .where(and(
       eq(placementJobs.collegeId,membership.collegeId),
       inArray(placementJobRounds.jobId,applications.map(row=>row.job.id)),
       ne(placementJobRounds.status,"CANCELLED"),
     )).orderBy(placementJobRounds.jobId,asc(placementJobRounds.sequence)),
  ]);

  const resultsByApplication = new Map<
    string,
    typeof results
  >();
  for (const result of results) {
    const current =
      resultsByApplication.get(
        result.applicationId,
      ) ?? [];
    current.push(result);
    resultsByApplication.set(
      result.applicationId,
      current,
    );
  }

  const bookingsByApplication = new Map<string, typeof bookings>();
  for(const booking of bookings){
    const entries=bookingsByApplication.get(booking.applicationId)??[];
    entries.push(booking);
    bookingsByApplication.set(booking.applicationId,entries);
  }
  const roundsByJob = new Map<string, typeof roundCatalog>();
  for(const round of roundCatalog){
    const entries=roundsByJob.get(round.jobId)??[];
    entries.push(round);
    roundsByJob.set(round.jobId,entries);
  }
  const offersByApplication = new Map<string, typeof offers>();
  for(const offer of offers){
    const entries=offersByApplication.get(offer.applicationId)??[];
    entries.push(offer);
    offersByApplication.set(offer.applicationId,entries);
  }
  const offerStatusByApplication = new Map<string,string>();
  for (const offer of offers) {
    if (offer.status === "ACCEPTED" ||
        !offerStatusByApplication.has(offer.applicationId)) {
      offerStatusByApplication.set(offer.applicationId, offer.status);
    }
  }

  const snapshotNow=new Date();
  return applications.map((row) => {
    const optOut=learnerStaffApplicationOptOut({
      submittedAt:row.application.submittedAt,
      submittedByUserId:row.application.submittedByUserId,
      learnerUserId:context.user.id,now:snapshotNow,
    });
    const appliedResults=resultsByApplication.get(row.application.id)??[];
    const ownBookings=bookingsByApplication.get(row.application.id)??[];
    const knownRounds=roundsByJob.get(row.job.id)??[];
    const unresolvedRound=knownRounds.find(round=>round.kind!=="TALK" &&
      !appliedResults.some(result=>result.roundId===round.id));
    // An unsuccessful completed round, a closed drive or withdrawn
    // application cannot show a future stage as an actionable NEXT round.
    const processEnded=row.job.driveStatus==="CLOSED" ||
      row.screening.status==="REJECTED" ||
      row.application.status!=="SUBMITTED" ||
      appliedResults.some(result=>result.outcome==="FAIL"||result.outcome==="ABSENT");
    const waitlisted=appliedResults.some(result=>result.outcome==="HOLD");
    const terminal =
      row.screening.status ===
        "SHORTLISTED" ||
      row.screening.status === "REJECTED";

    return {
      applicationId: row.application.id,
      applicationStatus:
        row.application.status,
      offerStatus: offerStatusByApplication.get(row.application.id) ?? null,
      channel: optOut.staffApplied?"PLACEMENT_CELL":row.application.channel,
      staffOptOutUntil:optOut.expiresAt,
      mayStaffOptOut:optOut.canOptOut,
      submittedAt:
        row.application.submittedAt,
      withdrawnAt:
        row.application.withdrawnAt,
      job: row.job,
      company: row.company,
      screening: {
        status: terminal
          ? row.screening.status
          : "UNDER_REVIEW",
        candidateMessage: terminal
          ? row.screening.candidateMessage
          : null,
        decidedAt: terminal
          ? row.screening.decidedAt
          : null,
      },
      results:appliedResults,
      // These are verified current candidate bookings; expected round times
      // below are informational and never presented as confirmed bookings.
      schedule:ownBookings.map(booking=>({
        roundId:booking.roundId,roundName:booking.roundName,
        sequence:booking.roundSequence,
        startsAt:booking.startsAt,endsAt:booking.endsAt,
        room:booking.room,panel:booking.panel,
        confirmed:true as const,learnerConfirmedAt:booking.learnerConfirmedAt,
      })),
      rounds:knownRounds.map(round=>{
        const result=appliedResults.find(item=>item.roundId===round.id);
        const state=result
          ?result.outcome==="PASS"?"CLEARED"
            :result.outcome==="FAIL"?"NOT_CLEARED"
            :result.outcome==="ABSENT"?"ABSENT":"WAITLISTED"
          :round.kind==="TALK"?"TALK"
          :processEnded?"ENDED"
          :waitlisted?"LATER"
          :round.id===unresolvedRound?.id?"NEXT":"LATER";
        return {roundId:round.id,sequence:round.sequence,kind:round.kind,
          name:round.name,status:round.status,state,
          expectedAt:round.scheduledAt,expectedVenue:round.venue,
          confirmed:ownBookings.some(booking=>booking.roundId===round.id)};
      }),
      offerHistory:(offersByApplication.get(row.application.id)??[])
        .sort((a,b)=>b.issuedAt.getTime()-a.issuedAt.getTime()),
      withdrawalMode:row.application.status==="SUBMITTED"
        ?ownBookings.length>0||appliedResults.length>0?"REQUEST" as const:"SELF" as const
        :"NONE" as const,
    };
  });
}
