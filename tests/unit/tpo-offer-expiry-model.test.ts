import { describe, expect, it } from "vitest";
import {
  isoDateInIndia, plusCalendarDays, projectTpoOfferExpiryWatchlist,
  tpoOfferExpiryCsv, tpoOfferExpiryQuerySchema, TPO_EXPIRY_CSV_ROW_LIMIT,
} from "@/modules/placements/tpo-offer-expiry-model";
describe("TPO offers expiry IST watchlist", () => {
  it("uses India calendar dates across UTC midnight", () => {
    expect(isoDateInIndia(new Date("2026-10-14T19:15:00.000Z"))).toBe("2026-10-15");
    expect(plusCalendarDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(tpoOfferExpiryQuerySchema.parse({ days: "10" }).days).toBe(10);
    expect(tpoOfferExpiryQuerySchema.safeParse({ days: "91" }).success).toBe(false);
  });
  it("does not conflate issued, accepted, expired, or unknown expiry", () => {
    const common = {
      jobId: "job", jobTitle: "=Drive", companyName: "+Employer",
      candidateName: "Test", roleTitle: "@Role", expiryAtIso: "2026-10-15T04:30:00Z",
    };
    const result = projectTpoOfferExpiryWatchlist([
      { ...common, offerId: "today", status: "ISSUED", expiryDayIst: "2026-10-14" },
      { ...common, offerId: "tomorrow", status: "ISSUED", expiryDayIst: "2026-10-15" },
      { ...common, offerId: "past", status: "ISSUED", expiryDayIst: "2026-10-13" },
      { ...common, offerId: "accepted", status: "ACCEPTED", expiryDayIst: "2026-10-15" },
    ], "2026-10-14", "2026-10-15");
    expect(result.rows.map((x) => x.offerId)).toEqual(["today", "tomorrow"]);
    expect(tpoOfferExpiryCsv(result)).toContain("'+Employer");
    expect(tpoOfferExpiryCsv(result)).toContain("'=Drive");
    expect(tpoOfferExpiryCsv(result)).toContain("'@Role");
  });
  it("caps rows and includes an explicit truncation notice", () => {
    const result = projectTpoOfferExpiryWatchlist(
      Array.from({ length: TPO_EXPIRY_CSV_ROW_LIMIT + 1 }, (_, index) => ({
        offerId: String(index), jobId: "job", jobTitle: "Drive",
        companyName: "Firm", roleTitle: "Role", candidateName: null,
        status: "ISSUED", expiryDayIst: "2026-10-16", expiryAtIso: "2026-10-16T04:30:00Z",
      })), "2026-10-14", "2026-10-20");
    expect(result.rows).toHaveLength(200);
    expect(result.truncated).toBe(true);
    expect(tpoOfferExpiryCsv(result)).toContain("TRUNCATED");
  });
});
