import { z } from "zod";

export const tpoStudentHistoryQuerySchema = z.object({
  membershipId: z.string().uuid(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export type HistoryApplicationFact = {
  id: string;
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
};

/** Facts are college-scoped in the database service before arriving here. */
export function projectTpoStudentPlacementHistory(
  applications: readonly HistoryApplicationFact[],
  offers: readonly HistoryOfferFact[],
  rounds: readonly HistoryRoundFact[],
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
      }));
    const appliedRounds = rounds
      .filter((round) => round.applicationId === application.id)
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
      id: application.id,
      jobTitle: application.jobTitle,
      companyName: application.companyName,
      seasonName: application.seasonName,
      roleTitle: application.roleTitle,
      applicationStatus: application.applicationStatus,
      channel: application.channel,
      submittedAt: application.submittedAt.toISOString(),
      offers: applicationOffers,
      appliedRounds,
    };
  });
  return {
    items,
    pageFacts: {
      applications: items.length,
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
