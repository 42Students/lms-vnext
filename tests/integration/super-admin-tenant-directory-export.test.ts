import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createCollege, archiveCollege } from "@/modules/colleges/service";
import { exportSuperAdminTenantDirectory } from "@/modules/colleges/admin-tenant-lifecycle-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "tenant-export", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: null };
describe.skipIf(!enabled)("Scoped tenant directory CSV (PG)", () => {
  afterAll(closeDatabaseConnection);
  it("uses viewer lifecycle filters and scope, neutralizes untrusted names, and denies foreign override/wrong role", async () => {
    const token = randomUUID().slice(0, 10);
    const own = await createCollege(admin, { organizationId: SEED_IDS.organization, name: "=SUM(1,2) " + token, code: "CSVA-" + token });
    const other = await createCollege(admin, { organizationId: SEED_IDS.organization, name: "Archived " + token, code: "CSVR-" + token });
    await archiveCollege(admin, other.id);
    const scoped = { ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: own.id } };
    const result = await exportSuperAdminTenantDirectory(scoped, { q: token, status: "ALL" });
    expect(result.exported).toBe(1); expect(result.cap).toBe(1000); expect(result.truncated).toBe(false);
    expect(result.csv).toContain(own.id); expect(result.csv).toContain("'=SUM"); expect(result.csv).not.toContain(other.id);
    expect((await exportSuperAdminTenantDirectory(scoped, { q: token, status: "ARCHIVED" })).exported).toBe(0);
    expect((await exportSuperAdminTenantDirectory(admin, { q: token, status: "ARCHIVED" })).csv).toContain(other.id);
    await expect(exportSuperAdminTenantDirectory(scoped, { q: token, organizationId: randomUUID() })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(exportSuperAdminTenantDirectory({ ...admin, user: { ...admin.user, systemRoles: [] } }, {})).rejects.toBeInstanceOf(AuthorizationError);
  });
});
