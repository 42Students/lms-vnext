import { describe, expect, it } from "vitest";
import { publicJoinAcceptSchema } from "@/modules/placements/public-join/form-model";

const valid = {
  token: "A".repeat(43), code: "005501", email: "recruiter@company.example",
  name: "Recruiter", companyName: "Example", designation: "", phone: "",
};

describe("TPO-campaigns-public-20 verified join input boundary", () => {
  it("requires signed-link-shaped token, email and six digits", () => {
    expect(publicJoinAcceptSchema.safeParse(valid).success).toBe(true);
    expect(publicJoinAcceptSchema.safeParse({ ...valid, code: "12345" }).success).toBe(false);
    expect(publicJoinAcceptSchema.safeParse({ ...valid, email: "person@gmail.com" }).success).toBe(false);
  });
  it("does not accept forged college, company or grant scopes", () => {
    expect(publicJoinAcceptSchema.safeParse({ ...valid, collegeId: "other" }).success).toBe(false);
    expect(publicJoinAcceptSchema.safeParse({ ...valid, companyId: "other" }).success).toBe(false);
    expect(publicJoinAcceptSchema.safeParse({ ...valid, capabilities: ["APPLICANT_EXPORT"] }).success).toBe(false);
  });
});
