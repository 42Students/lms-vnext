import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { listSuperAdminCompanyDirectory } from "@/modules/placements/admin-company-directory-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const superAdmin: RequestContext = {
  user: { id: SEED_IDS.superAdminUser, identityUid: "superadmin-company-read", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null, adminScope: null,
};
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "company-fixture-tpo", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
describe.skipIf(!enabled)("Super Admin company directory PostgreSQL", () => {
  afterAll(async () => {
    // Preserve fixtures referenced by append-only activity_events; disposable DB only.
    await closeDatabaseConnection();
  });
  it("includes seeded-in-test company within scope, hides it across colleges and denies wrong role", async () => {
    const unique = randomUUID().slice(0, 12);
    const created = await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "SA Company " + unique, primaryDomain: "sa-" + unique + ".example",
    });
    const chosen = { ...superAdmin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA } };
    const visible = await listSuperAdminCompanyDirectory(chosen, { q: "SA Company " + unique });
    expect(visible.rows.some(row => row.relationshipId === created.relationship.id)).toBe(true);
    expect(visible.total).toBeGreaterThanOrEqual(visible.rows.length);
    const later=await listSuperAdminCompanyDirectory(chosen,{q:"SA Company "+unique,page:2});
    expect(later.rows.some(row=>row.relationshipId===created.relationship.id)).toBe(false);
    const independent=await listSuperAdminCompanyDirectory(chosen,{q:"SA Company "+unique,status:"ACTIVE",companyStatus:"ALL"});
    expect(independent.rows.some(row=>row.relationshipId===created.relationship.id)).toBe(true);
    const trusted = await listSuperAdminCompanyDirectory(chosen, {q: "SA Company " + unique, trust:"TRUSTED"});
    const untrusted = await listSuperAdminCompanyDirectory(chosen, {q: "SA Company " + unique, trust:"UNTRUSTED"});
    expect([...trusted.rows,...untrusted.rows].some(row=>row.relationshipId===created.relationship.id)).toBe(true);
    expect(trusted.rows.every(row=>row.trusted)).toBe(true);
    expect(untrusted.rows.every(row=>!row.trusted)).toBe(true);
    const explicitlyScoped=await listSuperAdminCompanyDirectory(chosen,{q:"SA Company "+unique,collegeId:SEED_IDS.collegeA});
    expect(explicitlyScoped.rows.some(row=>row.relationshipId===created.relationship.id)).toBe(true);
    await expect(listSuperAdminCompanyDirectory(chosen,{q:"SA Company "+unique,collegeId:SEED_IDS.collegeB})).rejects.toBeInstanceOf(AuthorizationError);
    const foreign = { ...superAdmin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB } };
    const hidden = await listSuperAdminCompanyDirectory(foreign, { q: "SA Company " + unique });
    expect(hidden.rows).toHaveLength(0);
    await expect(listSuperAdminCompanyDirectory(tpo, {})).rejects.toBeInstanceOf(AuthorizationError);
  });
});
