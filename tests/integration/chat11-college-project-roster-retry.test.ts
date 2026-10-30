import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { createProjectInstance, archiveProjectInstance } from "@/modules/projects/instance-service";
import { listProjectMembers, addProjectMember, updateProjectMember, endProjectMember, reassignProjectPrimaryMentor } from "@/modules/projects/member-service";
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
  const projectIds = "select id from project_instances where slug like '" + prefix + "%'";
  await pool.query("delete from in_app_notifications where event_id in (select id from activity_events where metadata->>'projectId' in (" + projects + "))");
  await pool.query("delete from activity_events where metadata->>'projectId' in (" + projects + ")");
  // Every child FK is UUID-typed; keep metadata text comparison separate.
  // Delete descendant rows before tasks/resources/sprints and the workspace.
  for(const table of [
    "project_meeting_history","project_delivery_events","project_submission_reviews",
    "project_evaluations","project_task_submissions","project_task_comments",
    "project_submissions","project_meetings","project_members",
    "project_resource_audit","project_resources","project_tasks",
    "project_sprints","project_releases",
  ]) await pool.query("delete from "+table+" where project_id in ("+projectIds+")");
  await pool.query("delete from project_instances where slug like '" + prefix + "%'");
  const templates = "select id from project_templates where slug like '" + prefix + "%'";
  await pool.query("delete from project_template_college_assignments where template_id in (" + templates + ")");
  // Preserve DB070 append-only history and DB071 deferred version pointers.
  // The disposable fixture slugs/UUIDs are unique; no guard bypass is used.
  const retention = await pool.query<{retainHistory:boolean}>(
    "select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
    "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
    "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
    "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"",
  );
  if (!retention.rows[0]?.retainHistory) {
    await pool.query("delete from project_template_versions where template_id in (" + templates + ")");
    await pool.query("delete from project_templates where slug like '" + prefix + "%'");
  }
}
async function createProject() {
  const nonce = randomUUID().slice(0,12);
  const template = await createProjectTemplate(superAdmin, {
    slug: prefix + "template-" + nonce, title: "Roster retry template",
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
    templateId: template.template.id, slug: prefix + "project-" + nonce, title: "Roster retry project" });
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
    const eventCount = async () => Number((await pool.query<{ count: string }>(
      "select count(*)::text as count from activity_events where metadata->>'projectId'=$1",
      [project.id],
    )).rows[0]?.count ?? "0");
    const notificationCount = async () => Number((await pool.query<{ count: string }>(
      "select count(*)::text as count from in_app_notifications where event_id in (select id from activity_events where metadata->>'projectId'=$1)",
      [project.id],
    )).rows[0]?.count ?? "0");
    const eventsBefore = await eventCount();
    const noticesBefore = await notificationCount();
    expect(eventsBefore).toBeGreaterThan(0);
    expect(noticesBefore).toBe(1);
    const repeat = await replaceCollegeProjectLearners(admin, project.id, {
      learnerMembershipIds: [SEED_IDS.learnerCollegeAMembership], expectedUpdatedAt: original,
    });
    expect(repeat).toEqual({ added: 0, removed: 0, updatedAt: first.updatedAt });
    expect((await listProjectMembers(admin, project.id)).filter(row => row.role === "LEARNER"))
      .toHaveLength(1);
    expect(await eventCount()).toBe(eventsBefore);
    expect(await notificationCount()).toBe(noticesBefore);
  });

  it("PROJ-COL-STALE-03 a genuinely different stale request is refused, preserving the first write", async () => {
    const project = await createProject();
    const oldToken = project.updatedAt.toISOString();
    await replaceCollegeProjectLearners(admin, project.id, {
      learnerMembershipIds: [SEED_IDS.learnerCollegeAMembership], expectedUpdatedAt: oldToken,
    });
    await expect(replaceCollegeProjectLearners(admin, project.id, {
      learnerMembershipIds: [], mode:"REPLACE", confirmRemoval:true, expectedUpdatedAt: oldToken,
    })).rejects.toMatchObject({ code: "PROJECT_MEMBER_CONFLICT" });
    const members = await listProjectMembers(admin, project.id);
    expect(members.filter(row => row.role === "LEARNER").map(row => row.membershipId))
      .toEqual([SEED_IDS.learnerCollegeAMembership]);
  });

  it("PROJ-COL-DOUBLE-02 duplicate concurrent admin writes converge on one learner and one audit/notification", async () => {
    const project=await createProject();
    const token=project.updatedAt.toISOString();
    const payload={learnerMembershipIds:[SEED_IDS.learnerCollegeAMembership],expectedUpdatedAt:token};
    const results=await Promise.all([
      replaceCollegeProjectLearners(admin,project.id,payload),
      replaceCollegeProjectLearners(admin,project.id,payload),
    ]);
    expect(results.map(row=>row.added).sort()).toEqual([0,1]);
    const learners=(await listProjectMembers(admin,project.id)).filter(row=>row.role==="LEARNER");
    expect(learners.map(row=>row.membershipId)).toEqual([SEED_IDS.learnerCollegeAMembership]);
    const notifications=await pool.query<{count:string}>(
      `select count(*)::text as count from in_app_notifications
        where event_id in (select id from activity_events where metadata->>'projectId'=$1)`,
      [project.id],
    );
    expect(Number(notifications.rows[0]?.count??"0")).toBe(1);
  });

  it("PROJ-COL-TENANT-02 refuses revoked and wrong-college actors while retaining platform-wide Super Admin access", async () => {
    const project=await createProject();
    const payload={learnerMembershipIds:[SEED_IDS.learnerCollegeAMembership],
      expectedUpdatedAt:project.updatedAt.toISOString()};
    const contexts:RequestContext[]=[
      {...admin,membership:{...admin.membership!,collegeId:SEED_IDS.collegeB}},
      {...admin,membership:{...admin.membership!,status:"SUSPENDED"}},
      {...admin,user:{...admin.user,platformStatus:"DISABLED"}},
      {...admin,membership:{...admin.membership!,roles:["LEARNER"]}},
      {...superAdmin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}},
    ];
    for(const actor of contexts){
      await expect(replaceCollegeProjectLearners(actor,project.id,payload))
        .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    }
    expect((await listProjectMembers(admin,project.id)).filter(row=>row.role==="LEARNER"))
      .toHaveLength(0);
    const rows=await pool.query<{count:string}>(
      "select count(*)::text as count from project_members where project_id=$1 and role='LEARNER' and ended_at is null",
      [project.id],
    );
    expect(Number(rows.rows[0]?.count??"0")).toBe(0);
    // Platform-wide Super Admin is a valid service actor even without an
    // acting-college UI selection; navigation intentionally requires selection.
    const globalWrite=await replaceCollegeProjectLearners(superAdmin,project.id,payload);
    expect(globalWrite).toMatchObject({added:1,removed:0});
  });

  it("PROJ-COL-ARCHIVE-01 makes archived projects read-only for membership and mentor mutations",async()=>{
    const project=await createProject();
    const mentor=await addProjectMember(admin,project.id,{
      membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",
      isPrimary:true,
    });
    const archived=await archiveProjectInstance(admin,project.id);
    expect(archived.status).toBe("ARCHIVED");
    const eventsBefore=Number((await pool.query<{n:string}>(
      "select count(*)::text as n from activity_events where metadata->>'projectId'=$1",
      [project.id],
    )).rows[0]?.n??"0");
    await expect(addProjectMember(admin,project.id,{
      membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
    })).rejects.toMatchObject({code:"PROJECT_INVALID_STATE"});
    await expect(updateProjectMember(admin,project.id,mentor.id,{
      roleLabel:"Should never be saved",
    })).rejects.toMatchObject({code:"PROJECT_INVALID_STATE"});
    await expect(endProjectMember(admin,project.id,mentor.id))
      .rejects.toMatchObject({code:"PROJECT_INVALID_STATE"});
    await expect(reassignProjectPrimaryMentor(admin,project.id,SEED_IDS.facultyCollegeAMembership))
      .rejects.toMatchObject({code:"PROJECT_INVALID_STATE"});
    const active=await listProjectMembers(admin,project.id);
    expect(active.filter(row=>row.role==="LEARNER")).toHaveLength(0);
    expect(active.filter(row=>row.role==="MENTOR")).toHaveLength(1);
    expect(active.find(row=>row.id===mentor.id)?.roleLabel).not.toBe("Should never be saved");
    const eventsAfter=Number((await pool.query<{n:string}>(
      "select count(*)::text as n from activity_events where metadata->>'projectId'=$1",
      [project.id],
    )).rows[0]?.n??"0");
    expect(eventsAfter).toBe(eventsBefore);
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
