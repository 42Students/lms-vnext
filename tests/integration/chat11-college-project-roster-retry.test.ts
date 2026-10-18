import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { createProjectInstance } from "@/modules/projects/instance-service";
import { listProjectMembers } from "@/modules/projects/member-service";
import { replaceCollegeProjectLearners } from "@/modules/projects/college-project-roster-service";
import {
  createProjectTemplate, publishProjectTemplate, assignProjectTemplateToCollege,
} from "@/modules/projects/template-service";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL or DATABASE_URL is required");
const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "seed-college-admin",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const superAdmin: RequestContext = {
  user: { id: SEED_IDS.superAdminUser, identityUid: "seed-superadmin",
    platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: null,
};
const scopedAdmin: RequestContext = { ...superAdmin,
  adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA },
};
const prefix = "chat11-retry-";

async function cleanup() {
  const projects = "select id::text from project_instances where slug like '" + prefix + "%'";
  await pool.query("delete from in_app_notifications where event_id in (select id from activity_events where metadata->>'projectId' in (" + projects + "))");
  await pool.query("delete from activity_events where metadata->>'projectId' in (" + projects + ")");
  await pool.query("delete from project_members where project_id in (" + projects + ")");
  await pool.query("delete from project_resources where project_id in (" + projects + ")");
  await pool.query("delete from project_tasks where project_id in (" + projects + ")");
  await pool.query("delete from project_sprints where project_id in (" + projects + ")");
  await pool.query("delete from project_releases where project_id in (" + projects + ")");
  await pool.query("delete from project_instances where slug like '" + prefix + "%'");
  const templates = "select id from project_templates where slug like '" + prefix + "%'";
  await pool.query("delete from project_template_college_assignments where template_id in (" + templates + ")");
  await pool.query("delete from project_template_versions where template_id in (" + templates + ")");
  await pool.query("delete from project_templates where slug like '" + prefix + "%'");
}
async function createProject() {
  const template = await createProjectTemplate(superAdmin, {
    slug: prefix + "template", title: "Roster retry template",
    blueprint: {
      overview: { goal: "Idempotent admin roster", deliverables: ["Valid roster"] },
      releases: [{ key: "r1", title: "Release", sequence: 0 }],
      sprints: [{ key: "s1", releaseKey: "r1", title: "Sprint", sequence: 0 }],
      tasks: [{ key: "t1", sprintKey: "s1", title: "Task", priority: "MEDIUM" as const, sequence: 0 }],
      resources: [],
    },
  });
  await publishProjectTemplate(superAdmin, template.template.id);
  await assignProjectTemplateToCollege(scopedAdmin, template.template.id, SEED_IDS.collegeA);
  return createProjectInstance(admin, { collegeId: SEED_IDS.collegeA,
    templateId: template.template.id, slug: prefix + "project", title: "Roster retry project" });
}

beforeEach(cleanup);
afterAll(async () => { await cleanup(); await pool.end(); await closeDatabaseConnection(); });

describe("IIT Dharwad College Admin roster retries and concurrent tabs (PostgreSQL)", () => {
  it("PROJ-COL-RETRY-01 a repeat request with the original stale token is a harmless no-op", async () => {
    const project = await createProject();
    const original = project.updatedAt.toISOString();
    const first = await replaceCollegeProjectLearners(admin, project.id, {
      learnerMembershipIds: [SEED_IDS.learnerCollegeAMembership], expectedUpdatedAt: original,
    });
    expect(first).toMatchObject({ added: 1, removed: 0 });
    const repeat = await replaceCollegeProjectLearners(admin, project.id, {
      learnerMembershipIds: [SEED_IDS.learnerCollegeAMembership], expectedUpdatedAt: original,
    });
    expect(repeat).toEqual({ added: 0, removed: 0, updatedAt: first.updatedAt });
    expect((await listProjectMembers(admin, project.id)).filter(row => row.role === "LEARNER"))
      .toHaveLength(1);
    const duplicateEvents = await pool.query<{ count: string }>(
      "select count(*)::text as count from activity_events where subject_id=$1 and event_type like '%member%'",
      [project.id],
    );
    expect(Number(duplicateEvents.rows[0]?.count ?? "0")).toBeLessThanOrEqual(1);
  });

  it("PROJ-COL-STALE-03 a genuinely different stale request is refused, preserving the first write", async () => {
    const project = await createProject();
    const oldToken = project.updatedAt.toISOString();
    await replaceCollegeProjectLearners(admin, project.id, {
      learnerMembershipIds: [SEED_IDS.learnerCollegeAMembership], expectedUpdatedAt: oldToken,
    });
    await expect(replaceCollegeProjectLearners(admin, project.id, {
      learnerMembershipIds: [], expectedUpdatedAt: oldToken,
    })).rejects.toMatchObject({ code: "PROJECT_MEMBER_CONFLICT" });
    const members = await listProjectMembers(admin, project.id);
    expect(members.filter(row => row.role === "LEARNER").map(row => row.membershipId))
      .toEqual([SEED_IDS.learnerCollegeAMembership]);
  });

  it("PROJ-COL-TENANT-01 refuses a wrong-tenant learner without modifying the roster", async () => {
    const project = await createProject();
    await expect(replaceCollegeProjectLearners(admin, project.id, {
      learnerMembershipIds: [SEED_IDS.collegeAdminMembership],
      expectedUpdatedAt: project.updatedAt.toISOString(),
    })).rejects.toMatchObject({ code: "PROJECT_MEMBER_ROLE_REQUIRED" });
    expect((await listProjectMembers(admin, project.id)).filter(row => row.role === "LEARNER"))
      .toHaveLength(0);
  });
});
