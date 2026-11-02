import { describe, expect, it } from "vitest";
import { superAdminCourseBulkSchema } from "@/modules/courses/super-admin-course-bulk-visibility";
import {
  createSuperAdminHrInputSchema,
  superAdminHrListQuerySchema,
  updateSuperAdminHrInputSchema,
} from "@/modules/placements/super-admin-hr-validation";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const COLLEGE = "22222222-2222-4222-8222-222222222222";

describe("Phase 3: bulk course visibility is a bounded, confirmed command", () => {
  const ok = { courseIds: [id(1), id(2)], visibleToStudents: true, confirmed: true as const };

  it("accepts a confirmed command and maps legacy 0/1 flags to booleans", () => {
    expect(superAdminCourseBulkSchema.parse(ok).visibleToStudents).toBe(true);
    expect(superAdminCourseBulkSchema.parse({ ...ok, visibleToStudents: 0 }).visibleToStudents).toBe(false);
    expect(superAdminCourseBulkSchema.parse({ ...ok, visibleToStudents: 1 }).visibleToStudents).toBe(true);
  });
  it("requires the literal confirmation", () => {
    for (const confirmed of [false, "true", 1, undefined, null]) {
      expect(superAdminCourseBulkSchema.safeParse({ ...ok, confirmed }).success, String(confirmed)).toBe(false);
    }
  });
  it("rejects an empty list, duplicates and non-uuid ids", () => {
    expect(superAdminCourseBulkSchema.safeParse({ ...ok, courseIds: [] }).success).toBe(false);
    expect(superAdminCourseBulkSchema.safeParse({ ...ok, courseIds: [id(1), id(1)] }).success).toBe(false);
    expect(superAdminCourseBulkSchema.safeParse({ ...ok, courseIds: ["1", "2"] }).success).toBe(false);
  });
  it("caps one command at 100 courses", () => {
    const hundred = Array.from({ length: 100 }, (_, i) => id(i + 1));
    expect(superAdminCourseBulkSchema.safeParse({ ...ok, courseIds: hundred }).success).toBe(true);
    expect(superAdminCourseBulkSchema.safeParse({ ...ok, courseIds: [...hundred, id(101)] }).success).toBe(false);
  });
  it("refuses caller-injected fields such as a college or organization override", () => {
    expect(superAdminCourseBulkSchema.safeParse({ ...ok, collegeId: COLLEGE }).success).toBe(false);
    expect(superAdminCourseBulkSchema.safeParse({ ...ok, organizationId: COLLEGE }).success).toBe(false);
    expect(superAdminCourseBulkSchema.safeParse({ ...ok, status: "ARCHIVED" }).success).toBe(false);
  });
  it("rejects a non-boolean visibility value", () => {
    for (const v of ["yes", 2, null, undefined, {}]) {
      expect(superAdminCourseBulkSchema.safeParse({ ...ok, visibleToStudents: v }).success, String(v)).toBe(false);
    }
  });
});

describe("Phase 3: HR account inputs are strict", () => {
  const person = { displayName: "Asha Rao", phoneE164: "+919100063001", email: "asha@vnext.test" };

  describe("create", () => {
    it("accepts an existing company relationship", () => {
      expect(createSuperAdminHrInputSchema.safeParse({ ...person, companyRelationshipId: id(5) }).success).toBe(true);
    });
    it("accepts a new company, but not both and not neither", () => {
      const newCompany = { name: "Acme Systems", collegeId: COLLEGE };
      expect(createSuperAdminHrInputSchema.safeParse({ ...person, newCompany }).success).toBe(true);
      expect(createSuperAdminHrInputSchema.safeParse({ ...person, newCompany, companyRelationshipId: id(5) }).success).toBe(false);
      expect(createSuperAdminHrInputSchema.safeParse({ ...person }).success).toBe(false);
    });
    it("refuses injected fields such as a role or status", () => {
      const base = { ...person, companyRelationshipId: id(5) };
      for (const extra of [{ systemRoles: ["SUPER_ADMIN"] }, { status: "ACTIVE" }, { userId: id(9) }, { organizationId: COLLEGE }]) {
        expect(createSuperAdminHrInputSchema.safeParse({ ...base, ...extra }).success, JSON.stringify(extra)).toBe(false);
      }
    });
    it("refuses a malformed phone number or email", () => {
      const base = { companyRelationshipId: id(5), displayName: "Asha Rao" };
      expect(createSuperAdminHrInputSchema.safeParse({ ...base, phoneE164: "9100063001", email: "a@vnext.test" }).success).toBe(false);
      expect(createSuperAdminHrInputSchema.safeParse({ ...base, phoneE164: "+919100063001", email: "not-an-email" }).success).toBe(false);
    });
    it("limits relationship fan-out to 20 and the title to 160 characters", () => {
      const base = { ...person, companyRelationshipId: id(5) };
      const many = Array.from({ length: 21 }, (_, i) => id(i + 1));
      expect(createSuperAdminHrInputSchema.safeParse({ ...base, companyRelationshipIds: many }).success).toBe(false);
      expect(createSuperAdminHrInputSchema.safeParse({ ...base, title: "x".repeat(161) }).success).toBe(false);
      expect(createSuperAdminHrInputSchema.safeParse({ ...base, title: "x".repeat(160) }).success).toBe(true);
    });
  });

  describe("update", () => {
    it("requires at least one field", () => {
      expect(updateSuperAdminHrInputSchema.safeParse({}).success).toBe(false);
      expect(updateSuperAdminHrInputSchema.safeParse({ title: "Talent Lead" }).success).toBe(true);
    });
    it("only allows ACTIVE or ARCHIVED status, never DISABLED or an arbitrary value", () => {
      expect(updateSuperAdminHrInputSchema.safeParse({ status: "ARCHIVED" }).success).toBe(true);
      for (const status of ["DISABLED", "SUSPENDED", "admin", ""]) {
        expect(updateSuperAdminHrInputSchema.safeParse({ status }).success, status).toBe(false);
      }
    });
    it("ties a suspension reason to the archived status", () => {
      expect(updateSuperAdminHrInputSchema.safeParse({ status: "ARCHIVED", suspensionReason: "Left the company" }).success).toBe(true);
      expect(updateSuperAdminHrInputSchema.safeParse({ status: "ACTIVE", suspensionReason: "Left the company" }).success).toBe(false);
      expect(updateSuperAdminHrInputSchema.safeParse({ suspensionReason: "Left the company" }).success).toBe(false);
      expect(updateSuperAdminHrInputSchema.safeParse({ status: "ARCHIVED", suspensionReason: "no" }).success).toBe(false);
    });
    it("refuses injected fields", () => {
      for (const extra of [{ systemRoles: ["SUPER_ADMIN"] }, { userId: id(9) }, { companyId: id(9) }]) {
        expect(updateSuperAdminHrInputSchema.safeParse({ title: "Lead", ...extra }).success, JSON.stringify(extra)).toBe(false);
      }
    });
  });

  describe("list query", () => {
    it("applies defaults and rejects unknown keys", () => {
      expect(superAdminHrListQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 25 });
      expect(superAdminHrListQuerySchema.safeParse({ collegeId: COLLEGE }).success).toBe(false);
    });
    it("bounds paging and restricts status", () => {
      expect(superAdminHrListQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false);
      expect(superAdminHrListQuerySchema.safeParse({ pageSize: 0 }).success).toBe(false);
      expect(superAdminHrListQuerySchema.safeParse({ page: 10001 }).success).toBe(false);
      expect(superAdminHrListQuerySchema.safeParse({ status: "DELETED" }).success).toBe(false);
      expect(superAdminHrListQuerySchema.safeParse({ q: "x".repeat(121) }).success).toBe(false);
    });
  });
});
