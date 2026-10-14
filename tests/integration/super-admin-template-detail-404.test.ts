import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createProjectTemplate, getProjectTemplateDetail } from "@/modules/projects/template-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "template-detail-404", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: null };
describe.skipIf(!enabled)("Super Admin template detail real PostgreSQL", () => {
  afterAll(async () => { await closeDatabaseConnection(); });
  it("reads own in-test template globally and under a selected college, never exposes wrong-role", async () => {
    const key = randomUUID().slice(0, 10);
    const created = await createProjectTemplate(admin, { slug: "detail-" + key, title: "Detail " + key,
      blueprint: { overview: { deliverables: [] }, releases: [], sprints: [], tasks: [], resources: [] } });
    const id = created.template.id;
    expect((await getProjectTemplateDetail(admin, id)).template.id).toBe(id);
    expect((await getProjectTemplateDetail({ ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA } }, id)).template.id).toBe(id);
    await expect(getProjectTemplateDetail(admin, randomUUID())).rejects.toMatchObject({code:"PROJECT_TEMPLATE_NOT_FOUND"});
    await expect(getProjectTemplateDetail({...admin,user:{...admin.user,systemRoles:[]}}, id)).rejects.toBeInstanceOf(AuthorizationError);
    // Persisted source-only fixture intentionally remains; activity_events are append-only.
  });
});
