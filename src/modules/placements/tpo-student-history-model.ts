import { z } from "zod";

export const tpoStudentHistoryQuerySchema = z.object({
  membershipId: z.string().uuid(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export type HistoryApplicationFact = {
  id:string;
  jobId?:string;
  addedByCollege?:boolean;
  jobTitle: string;
  companyName: string;
  seasonName: string;
  roleTitle: string;
  applicationStatus: string;
  channel: string;
  submittedAt: Date;
};

export type HistoryOfferFact = {
  id: string;
  applicationId: string;
  status: string;
  roleTitle: string;
  annualCtcInr: number | null;
  issuedAt: Date;
  joiningStatus: string | null;
};

export type HistoryRoundFact = {
  id: string;
  applicationId: string;
  name: string;
  outcome: string;
  appliedAt: Date | null;
  status: string;
  version: number;
  submittedAt: Date;
};

export type HistoryApplicationEventFact = {
  id: string;
  applicationId: string;
  fromStatus: string | null;
  toStatus: string;
  createdAt: Date;
};

export type HistoryOfferEventFact = {
  id: string;
  offerId: string;
  fromStatus: string | null;
  toStatus: string;
  createdAt: Date;
};

/** Facts are college-scoped in the database service before arriving here. */
export function projectTpoStudentPlacementHistory(
  applications: readonly HistoryApplicationFact[],
  offers: readonly HistoryOfferFact[],
  rounds: readonly HistoryRoundFact[],
  applicationEvents: readonly HistoryApplicationEventFact[] = [],
  offerEvents: readonly HistoryOfferEventFact[] = [],
) {
  const items = applications.map((application) => {
    const applicationOffers = offers
      .filter((offer) => offer.applicationId === application.id)
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime() || a.id.localeCompare(b.id))
      .map((offer) => ({
        id: offer.id,
        status: offer.status,
        roleTitle: offer.roleTitle,
        annualCtcInr: offer.annualCtcInr,
        issuedAt: offer.issuedAt.toISOString(),
        joiningStatus: offer.joiningStatus,
        statusEvents: offerEvents
          .filter((event) => event.offerId === offer.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() ||
            a.id.localeCompare(b.id))
          .map((event) => ({
            id: event.id,
            fromStatus: event.fromStatus,
            toStatus: event.toStatus,
            at: event.createdAt.toISOString(),
          })),
      }));
    const allRoundVersions = rounds
      .filter((round) => round.applicationId === application.id)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime() ||
        b.version - a.version || a.id.localeCompare(b.id));
    const appliedRounds = allRoundVersions
      .filter((round) => round.status === "APPLIED")
      .sort((a, b) =>
        (b.appliedAt?.getTime() ?? 0) - (a.appliedAt?.getTime() ?? 0) ||
        a.id.localeCompare(b.id),
      )
      .map((round) => ({
        id: round.id,
        name: round.name,
        outcome: round.outcome,
        appliedAt: round.appliedAt?.toISOString() ?? null,
      }));
    return {
      id:application.id,
      jobId:application.jobId??null,
      addedByCollege:application.addedByCollege??false,
      jobTitle:application.jobTitle,
      companyName: application.companyName,
      seasonName: application.seasonName,
      roleTitle: application.roleTitle,
      applicationStatus: application.applicationStatus,
      channel: application.channel,
      submittedAt: application.submittedAt.toISOString(),
      offers: applicationOffers,
      appliedRounds,
      resultVersions: allRoundVersions.map((round) => ({
        id: round.id,
        name: round.name,
        version: round.version,
        outcome: round.outcome,
        status: round.status,
        submittedAt: round.submittedAt.toISOString(),
        appliedAt: round.appliedAt?.toISOString() ?? null,
      })),
      applicationEvents: applicationEvents
        .filter((event) => event.applicationId === application.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() ||
          a.id.localeCompare(b.id))
        .map((event) => ({
          id: event.id,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          at: event.createdAt.toISOString(),
        })),
    };
  });
  return {
    items,
    pageFacts: {
      applications: items.length,
      resultVersions: items.reduce((count, item) =>
        count + item.resultVersions.length, 0),
      stagedResults: items.reduce((count, item) =>
        count + item.resultVersions.filter((result) =>
          result.status === "STAGED").length, 0),
      offerVersions: items.reduce((count, item) => count + item.offers.length, 0),
      acceptedOfferVersions: items.reduce(
        (count, item) => count + item.offers.filter((offer) => offer.status === "ACCEPTED").length, 0,
      ),
      confirmedJoins: items.reduce(
        (count, item) => count + item.offers.filter((offer) =>
          offer.status === "ACCEPTED" && offer.joiningStatus === "JOINED",
        ).length, 0,
      ),
    },
  };
}
