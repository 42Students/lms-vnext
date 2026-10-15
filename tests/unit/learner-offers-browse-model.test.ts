import { describe, expect, it } from "vitest";
import {
  browseOwnLearnerOffers,
  learnerOfferViewSchema,
} from "@/modules/placements/learner-offers-browse-model";

const rows = [
  { offer: { id: "one", status: "ISSUED", issuedAt: new Date("2026-10-10T08:00:00Z") } },
  { offer: { id: "two", status: "ACCEPTED", issuedAt: new Date("2026-10-11T08:00:00Z") } },
  { offer: { id: "three", status: "DECLINED", issuedAt: new Date("2026-10-12T08:00:00Z") } },
  { offer: { id: "four", status: "WITHDRAWN", issuedAt: new Date("2026-10-13T08:00:00Z") } },
] as const;

describe("Own learner offer browser", () => {
  it("normalizes views only through a closed Zod union", () => {
    expect(learnerOfferViewSchema.parse("pending")).toBe("pending");
    expect(learnerOfferViewSchema.safeParse("another-membership").success).toBe(false);
  });
  it("includes all persisted statuses with stable newest-first ordering", () => {
    const view = browseOwnLearnerOffers(rows, "all");
    expect(view.items.map((row) => row.offer.id))
      .toEqual(["four", "three", "two", "one"]);
    expect(view.counts).toEqual({
      all: 4, pending: 1, accepted: 1, closed: 2, declined: 1, withdrawn: 1,
    });
  });
  it("separates actionable issued offers from accepted and closed offers", () => {
    expect(browseOwnLearnerOffers(rows, "pending").items.map((row) => row.offer.id))
      .toEqual(["one"]);
    expect(browseOwnLearnerOffers(rows, "accepted").items.map((row) => row.offer.id))
      .toEqual(["two"]);
    expect(browseOwnLearnerOffers(rows, "closed").items.map((row) => row.offer.id))
      .toEqual(["four", "three"]);
    expect(rows.map((row) => row.offer.id)).toEqual(["one", "two", "three", "four"]);
  });
  it("keeps no-persisted-offers distinct from filters returning nothing", () => {
    expect(browseOwnLearnerOffers([], "all")).toEqual({
      counts: { all: 0, pending: 0, accepted: 0, closed: 0, declined: 0, withdrawn: 0 },
      items: [],
    });
    expect(browseOwnLearnerOffers(rows.slice(0, 1), "accepted").counts.all).toBe(1);
    expect(browseOwnLearnerOffers(rows.slice(0, 1), "accepted").items).toEqual([]);
  });
});
