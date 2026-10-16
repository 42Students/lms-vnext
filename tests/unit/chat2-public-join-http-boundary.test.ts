import { describe, expect, it } from "vitest";
import { publicJoinCodeSendAllowed } from "@/modules/placements/public-join/code-policy";
import { publicJoinAcceptSchema } from "@/modules/placements/public-join/form-model";

describe("TPO-campaigns-public-19/20 public join denial contracts", () => {
  it("keeps invalid input separate from a valid but rate-limited request", () => {
    expect(publicJoinCodeSendAllowed({ emailHour: 0, linkHour: 0, networkHour: 0 })).toBe(true);
    expect(publicJoinCodeSendAllowed({ emailHour: 0, linkHour: 300, networkHour: 0 })).toBe(false);
    expect(publicJoinCodeSendAllowed({ emailHour: 0, linkHour: 0, networkHour: 20 })).toBe(false);
  });
  it("rejects forged privilege additions before database work", () => {
    expect(publicJoinAcceptSchema.safeParse({
      token: "a".repeat(43), email: "recruiter@business.example",
      name: "Recruiter", companyName: "Business", designation: "", phone: "",
      code: "123456", status: "ACTIVE",
    }).success).toBe(false);
  });
});
