import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createProjectTemplate, getProjectTemplateDetail, listProjectTemplates, reviseProjectTemplate } from "@/modules/projects/template-service";
import { getSuperAdminTemplateSubview } from "@/modules/projects/template-subview-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "template-admin",
  platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: null };
const scoped: RequestContext = { ...admin,
  adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA } };
const foreign: RequestContext = { ...admin,
  user: { ...admin.user, systemRoles: [] } };
describe.skipIf(!enabled)("Super Admin scoped global template read (PG)", () => {
  afterAll(async () => {
    // Keep immutable versions and activity history; fixture is uniquely named.
    await closeDatabaseConnection();
  });
  it("reads a new template in both scopes, rejects wrong role and prevents scoped mutation", async () => {
    const suffix = randomUUID().slice(0, 12);
    const created = await createProjectTemplate(admin, {
      slug: "chat6-template-" + suffix, title: "Chat 6 scoped template " + suffix,
      blueprint: { overview: { goal: "Read-only scope test", deliverables: ["Evidence"] },
        releases: [{ key: "release-1", title: "Release", sequence: 0 }],
        sprints: [{ key: "sprint-1", releaseKey: "release-1", title: "Sprint", sequence: 0 }],
        tasks: [{ key: "task-1", sprintKey: "sprint-1", title: "Task", priority: "HIGH", sequence: 0 }],
        resources: [] },
    });
    for (const context of [admin, scoped]) {
      const detail = await getProjectTemplateDetail(context, created.template.id);
      expect(detail.template.id).toBe(created.template.id);
      expect((await listProjectTemplates(context)).some(t => t.id === created.template.id)).toBe(true);
      expect((await getSuperAdminTemplateSubview(context, created.template.id, true)).template.id).toBe(created.template.id);
    }
    await expect(getProjectTemplateDetail(foreign, created.template.id)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(reviseProjectTemplate(scoped, created.template.id, {
      title: "Forbidden", blueprint: created.version.blueprint,
    })).rejects.toBeInstanceOf(AuthorizationError);
  });
});
