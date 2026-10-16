import { describe, expect, it } from "vitest";
import { publicJoinAcceptSchema } from "@/modules/placements/public-join/form-model";
import { publicJoinCodeSendAllowed } from "@/modules/placements/public-join/code-policy";

describe("TPO-campaigns-public-20 safe transaction boundaries", () => {
  it("cannot supply grant actor, tenant or verification status from the browser", () => {
    const input = { token: "A".repeat(43), code: "001234",
      email: "test@company.example", name: "Verified Recruiter",
      companyName: "", designation: "", phone: "" };
    expect(publicJoinAcceptSchema.safeParse(input).success).toBe(true);
    for (const extras of [
      { collegeId: "foreign" }, { recruiterUserId: "forged" },
      { verificationStatus: "VERIFIED" }, { validUntil: "never" },
      { grantedByUserId: "forged" },
    ]) expect(publicJoinAcceptSchema.safeParse({ ...input, ...extras }).success).toBe(false);
  });
  it("rejects invalid rate-counter values fail-closed", () => {
    expect(publicJoinCodeSendAllowed({ emailHour: NaN, linkHour: 0, networkHour: 0 })).toBe(false);
    expect(publicJoinCodeSendAllowed({ emailHour: 1, linkHour: 1, networkHour: Infinity })).toBe(false);
  });
});
