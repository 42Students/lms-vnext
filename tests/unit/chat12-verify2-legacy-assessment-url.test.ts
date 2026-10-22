import { describe, expect, it } from "vitest";
import { placementLegacyPostingDetailsSchema } from "@/modules/placements/placement-legacy-posting-model";

describe("chat-12 legacy job assessment URL parity", () => {
  it("permits empty, HTTP and HTTPS assessment links independently of the application URL", () => {
    expect(placementLegacyPostingDetailsSchema.safeParse({assessmentUrl:null}).success).toBe(true);
    expect(placementLegacyPostingDetailsSchema.safeParse({assessmentUrl:""}).success).toBe(true);
    expect(placementLegacyPostingDetailsSchema.safeParse({assessmentUrl:"https://exam.example.org/test"}).success).toBe(true);
    expect(placementLegacyPostingDetailsSchema.safeParse({assessmentUrl:"http://exam.example.org/test"}).success).toBe(true);
  });
  it("rejects malformed, credential-bearing and overlong links at the API boundary", () => {
    for (const value of ["http://", "javascript:alert(1)", "https://user:pass@example.org/test",
      "https://example.org/"+ "a".repeat(2048)]) {
      expect(placementLegacyPostingDetailsSchema.safeParse({assessmentUrl:value}).success).toBe(false);
    }
  });
});
