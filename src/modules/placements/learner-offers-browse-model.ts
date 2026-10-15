import { z } from "zod";

export const learnerOfferViewSchema = z.enum([
  "all",
  "pending",
  "accepted",
  "closed",
  "declined",
  "withdrawn",
]);

export type LearnerOfferView = z.infer<typeof learnerOfferViewSchema>;

export type LearnerOfferBrowseRow = {
  offer: {
    id: string;
    status: string;
    issuedAt: Date;
  };
};

export function browseOwnLearnerOffers<T extends LearnerOfferBrowseRow>(
  rows: readonly T[],
  view: LearnerOfferView,
) {
  const counts = {
    all: rows.length,
    pending: rows.filter((row) => row.offer.status === "ISSUED").length,
    accepted: rows.filter((row) => row.offer.status === "ACCEPTED").length,
    declined: rows.filter(row=>row.offer.status==="DECLINED").length,
    withdrawn: rows.filter(row=>row.offer.status==="WITHDRAWN").length,
    closed: rows.filter((row) =>
      row.offer.status === "DECLINED" ||
      row.offer.status === "WITHDRAWN",
    ).length,
  };
  const matches = (status: string) =>
    view === "all" ||
    (view === "pending" && status === "ISSUED") ||
    (view === "accepted" && status === "ACCEPTED") ||
    (view === "closed" && (status === "DECLINED" || status === "WITHDRAWN")) ||
    (view === "declined" && status === "DECLINED") ||
    (view === "withdrawn" && status === "WITHDRAWN");

  return {
    counts,
    items: rows.filter((row) => matches(row.offer.status))
      .sort((a, b) =>
        b.offer.issuedAt.getTime() - a.offer.issuedAt.getTime() ||
        a.offer.id.localeCompare(b.offer.id),
      ),
  };
}
