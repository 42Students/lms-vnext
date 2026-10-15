import { describe, expect, it } from "vitest";
import { adminCompaniesQuerySchema, projectAdminCompanies } from "@/modules/placements/admin-company-directory-model";
describe("Super Admin company directory projection", () => {
  it("derives counts from only already scoped records", () => {
    const rows = [
      { relationshipId: "a", companyId: "c", name: "A", collegeId: "1", collegeName: "One",
        organizationId: "o", relationshipStatus: "ACTIVE", companyStatus: "ACTIVE", trusted: true, website: null },
      { relationshipId: "b", companyId: "c", name: "A", collegeId: "2", collegeName: "Two",
        organizationId: "o", relationshipStatus: "ACTIVE", companyStatus: "ACTIVE", trusted: false, website: null },
    ];
    expect(projectAdminCompanies(rows)).toMatchObject({
      distinctCompanies: 1, relationships: 2, trustedRelationships: 1,
    });
  });
  it("strictly validates filters", () => {
    expect(adminCompaniesQuerySchema.safeParse({ status: "HIDDEN" }).success).toBe(false);
    expect(adminCompaniesQuerySchema.safeParse({ q: "x".repeat(101) }).success).toBe(false);
    expect(adminCompaniesQuerySchema.parse({trust:"TRUSTED"}).trust).toBe("TRUSTED");
    expect(adminCompaniesQuerySchema.safeParse({trust:"PENDING"}).success).toBe(false);
  });
});
