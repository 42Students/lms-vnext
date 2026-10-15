import { describe, expect, it } from "vitest";
import { publicPublicationDecision, publicPublicationTimestamp, publicPlacementPublicationInput } from "@/modules/placements/public-page/publication-policy";

describe("T-S2-08 publisher decisions", () => {
  it("never enables without a real known cohort of five or more", () => {
    expect(publicPublicationDecision({enabled:true}, null)).toBe("NOT_CONFIGURED");
    expect(publicPublicationDecision({enabled:true}, {populationCount:null,publishedAt:null})).toBe("SMALL_COHORT");
    expect(publicPublicationDecision({enabled:true}, {populationCount:4,publishedAt:null})).toBe("SMALL_COHORT");
    expect(publicPublicationDecision({enabled:true}, {populationCount:5,publishedAt:null})).toBe("ENABLE");
  });
  it("allows disabling without demanding old data", () => {
    expect(publicPublicationDecision({enabled:false}, null)).toBe("DISABLE");
    expect(publicPublicationTimestamp(false,new Date("2026-10-16T00:00:00Z"))).toBeNull();
  });
  it("validates the exact request and freezes publication timestamp", () => {
    expect(publicPlacementPublicationInput.safeParse({enabled:true, populationCount:999}).success).toBe(false);
    const now=new Date("2026-10-16T00:00:00Z");
    expect(publicPublicationTimestamp(true,now)?.toISOString()).toBe(now.toISOString());
  });
});
