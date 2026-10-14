import { describe, expect, it } from "vitest";
import { HR_OFFER_PAGE_SIZE, HR_OFFER_STATES, hrOfferPageBounds, hrApplicantFilterSchema } from "@/modules/placements/hr-job-applicants-model";

describe("HR offer report pagination contract", () => {
  it("bounds each database page and labels empty out-of-range pages", () => {
    expect(HR_OFFER_PAGE_SIZE).toBe(25);
    expect(hrOfferPageBounds(1,26)).toMatchObject({first:1,last:25,pages:2});
    expect(hrOfferPageBounds(2,26)).toMatchObject({first:26,last:26,pages:2});
    expect(hrOfferPageBounds(5,26).first).toBe(0);
  });

  it("accepts only recorded status codes and positive page numbers", () => {
    expect(HR_OFFER_STATES).toEqual(["ALL","ISSUED","ACCEPTED","DECLINED","WITHDRAWN"]);
    expect(hrApplicantFilterSchema.safeParse({ tab:"offers", offerState:"ACCEPTED", offerPage:"2" }).success).toBe(true);
    expect(hrApplicantFilterSchema.safeParse({ offerPage:"-1" }).success).toBe(false);
    expect(hrApplicantFilterSchema.safeParse({ offerState:"LOI" }).success).toBe(false);
  });
});
