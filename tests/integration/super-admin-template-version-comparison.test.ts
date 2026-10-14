import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createProjectTemplate, reviseProjectTemplate } from "@/modules/projects/template-service";
import { getSuperAdminTemplateVersionComparison } from "@/modules/projects/template-version-comparison-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "template-compare",
  platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: null };
describe.skipIf(!enabled)("Super Admin version comparison (PG)", () => {
  afterAll(closeDatabaseConnection);
  it("reads immutable old snapshots in global and college scope; rejects foreign version UUID and wrong role", async () => {
    const blueprint = { overview: { goal: "Goal", deliverables: [] },
      releases: [{ key: "r1", title: "Release", sequence: 0 }],
      sprints: [{ key: "s1", title: "Sprint", releaseKey: "r1", sequence: 0 }],
      tasks: [{ key: "t1", title: "Original", sprintKey: "s1", priority: "HIGH" as const, sequence: 0 }], resources: [] };
    const made = await createProjectTemplate(admin, { slug: "compare-" + randomUUID(), title: "Original", blueprint });
    const other = await createProjectTemplate(admin, { slug: "compare-" + randomUUID(), title: "Foreign", blueprint });
    await reviseProjectTemplate(admin, made.template.id, { title: "Revised", blueprint, changeNote: "Test revision" });
    for (const context of [admin, { ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA } }]) {
      const detail = await getSuperAdminTemplateVersionComparison(context, { templateId: made.template.id, versionId: made.version.id });
      expect(detail.selected.title).toBe("Original");
      expect(detail.current.title).toBe("Revised");
      expect(detail.changes.map(row => row.label)).toContain("Title");
      for (const versionId of [other.version.id, randomUUID()]) {
        await expect(getSuperAdminTemplateVersionComparison(context, { templateId: made.template.id, versionId }))
          .rejects.toMatchObject({ code: "PROJECT_TEMPLATE_VERSION_NOT_FOUND" });
      }
    }
    await expect(getSuperAdminTemplateVersionComparison({ ...admin, user: { ...admin.user, systemRoles: [] } },
      { templateId: made.template.id, versionId: made.version.id })).rejects.toBeInstanceOf(AuthorizationError);
    // Retain immutable versions and activity history in the disposable database.
  });
});
