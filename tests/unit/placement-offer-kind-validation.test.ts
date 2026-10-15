import { describe, expect, it } from "vitest";
import { issuePlacementOfferInputSchema } from "@/modules/placements/validation";

describe("issue placement offer kind", () => {
  it("accepts OFFER or LOI, allows omission and rejects anything else", () => {
    expect(issuePlacementOfferInputSchema.parse({ roleTitle: "Engineer" }).kind).toBeUndefined();
    expect(issuePlacementOfferInputSchema.parse({ roleTitle: "Engineer", kind: "LOI" }).kind).toBe("LOI");
    expect(issuePlacementOfferInputSchema.parse({ roleTitle: "Engineer", kind: "OFFER" }).kind).toBe("OFFER");
    expect(issuePlacementOfferInputSchema.safeParse({ roleTitle: "Engineer", kind: "loi" }).success).toBe(false);
    expect(issuePlacementOfferInputSchema.safeParse({ roleTitle: "Engineer", kind: "CONTRACT" }).success).toBe(false);
  });
});
