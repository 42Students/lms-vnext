import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createProjectTemplate, getProjectTemplateDetail, publishProjectTemplate } from "@/modules/projects/template-service";
import { editSuperAdminTemplateMetadata } from "@/modules/projects/template-metadata-edit-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "metadata-edit", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: null };
describe.skipIf(!enabled)("Draft template metadata revision (PG)", () => {
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("creates an audited immutable revision, preserves blueprint, denies scoped/wrong-role/stale/published writes", async () => {
    const blueprint = { overview: { goal: "Goal", deliverables: [] }, releases: [{ key: "r", title: "Release", sequence: 0 }],
      sprints: [{ key: "s", title: "Sprint", releaseKey: "r", sequence: 0 }], tasks: [{ key: "t", title: "Task", sprintKey: "s", priority: "HIGH" as const, sequence: 0 }], resources: [] };
    const made = await createProjectTemplate(admin, { slug: "metadata-" + randomUUID(), title: "Original", blueprint });
    const input = { title: "Revised", summary: "Summary", changeNote: "Metadata fixture", expectedCurrentVersion: 1, expectedUpdatedAt: made.template.updatedAt.toISOString() };
    const scoped = { ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB } };
    for (const id of [made.template.id, randomUUID()]) await expect(editSuperAdminTemplateMetadata(scoped, id, input)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(editSuperAdminTemplateMetadata({ ...admin, user: { ...admin.user, systemRoles: [] } }, made.template.id, input)).rejects.toBeInstanceOf(AuthorizationError);
    const edited = await editSuperAdminTemplateMetadata(admin, made.template.id, input);
    expect(edited.template.currentVersion).toBe(2);
    expect(edited.version.blueprint).toEqual(made.version.blueprint);
    await expect(editSuperAdminTemplateMetadata(admin, made.template.id, input)).rejects.toMatchObject({ code: "PROJECT_TEMPLATE_STALE_VERSION" });
    const detail = await getProjectTemplateDetail(admin, made.template.id);
    expect(detail.versions).toHaveLength(2);
    expect(detail.versions.find(row => row.id === made.version.id)?.title).toBe("Original");
    const audit = await pool!.query<{ metadata: { newVersion: number } }>("select metadata from activity_events where event_type='projects.template.metadata_updated' and subject_id=$1", [made.template.id]);
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0].metadata.newVersion).toBe(2);
    await publishProjectTemplate(admin, made.template.id);
    const published = await getProjectTemplateDetail(admin, made.template.id);
    await expect(editSuperAdminTemplateMetadata(admin, made.template.id, { ...input, title: "Forbidden", expectedCurrentVersion: 2,
      expectedUpdatedAt: published.template.updatedAt.toISOString() })).rejects.toMatchObject({ code: "PROJECT_TEMPLATE_INVALID_STATE" });
    // Retain immutable versions/activity and all referenced users.
  });
});
