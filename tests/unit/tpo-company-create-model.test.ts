import { describe, expect, it } from "vitest";
import { tpoCreateCompanySchema } from "@/modules/placements/tpo-company-create-model";

describe("TPO company directory create contract", () => {
  it("requires explicit confirmation and a canonical name", () => {
    expect(tpoCreateCompanySchema.parse({
      confirmed: true,
      name: "  Recruiter Company  ",
      primaryDomain: "recruiter-company.example",
    })).toMatchObject({
      confirmed: true,
      name: "Recruiter Company",
    });
    expect(tpoCreateCompanySchema.safeParse({
      confirmed: false,
      name: "Company",
    }).success).toBe(false);
    expect(tpoCreateCompanySchema.safeParse({
      confirmed: true,
      name: "X",
    }).success).toBe(false);
  });

  it("rejects client tenant/owner IDs and malformed website/domain", () => {
    const valid = { confirmed: true, name: "Example Company" };
    expect(tpoCreateCompanySchema.safeParse({
      ...valid, collegeId: "20000000-0000-4000-8000-000000000002",
    }).success).toBe(false);
    expect(tpoCreateCompanySchema.safeParse({
      ...valid, isTrusted: true,
    }).success).toBe(false);
    expect(tpoCreateCompanySchema.safeParse({
      ...valid, ownerMembershipId: "40000000-0000-4000-8000-000000000002",
    }).success).toBe(false);
    expect(tpoCreateCompanySchema.safeParse({
      ...valid, websiteUrl: "javascript:alert(1)",
    }).success).toBe(false);
    expect(tpoCreateCompanySchema.safeParse({
      ...valid, primaryDomain: "@invalid domain",
    }).success).toBe(false);
  });
});
