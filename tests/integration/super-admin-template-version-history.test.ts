import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createProjectTemplate, reviseProjectTemplate } from "@/modules/projects/template-service";
import { getSuperAdminTemplateVersionHistory } from "@/modules/projects/template-version-history-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "version-pages", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: null };
describe.skipIf(!enabled)("Template version history paging (PG)", () => {
  afterAll(closeDatabaseConnection);
  it("returns 25 immutable snapshots in version order and no scoped assignment data", async () => {
    const blueprint = { overview: { goal: "Goal", deliverables: [] }, releases: [{ key: "r", title: "Release", sequence: 0 }],
      sprints: [{ key: "s", releaseKey: "r", title: "Sprint", sequence: 0 }],
      tasks: [{ key: "t", sprintKey: "s", title: "Task", priority: "HIGH" as const, sequence: 0 }], resources: [] };
    const made = await createProjectTemplate(admin, { slug: "history-" + randomUUID(), title: "History", blueprint });
    for (let i = 0; i < 25; i++) await reviseProjectTemplate(admin, made.template.id, { title: "History", blueprint, changeNote: `Revision ${i}` });
    const first = await getSuperAdminTemplateVersionHistory(admin, made.template.id, {});
    expect(first.detail.versions).toHaveLength(25);
    expect(first.detail.versions[0].version).toBe(26);
    const scoped = { ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB } };
    const last = await getSuperAdminTemplateVersionHistory(scoped, made.template.id, { page: 999 });
    expect(last.paging.page).toBe(2);
    expect(last.detail.versions.map(row => row.id)).toEqual([made.version.id]);
    expect(last.detail.assignments).toEqual([]);
    expect(last.detail.assignedColleges).toEqual([]);
    expect(last.detail.currentVersion?.version).toBe(26);
    await expect(getSuperAdminTemplateVersionHistory({ ...admin, user: { ...admin.user, systemRoles: [] } }, made.template.id, {})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getSuperAdminTemplateVersionHistory(scoped, randomUUID(), {})).rejects.toMatchObject({ code: "PROJECT_TEMPLATE_NOT_FOUND" });
  });
});
