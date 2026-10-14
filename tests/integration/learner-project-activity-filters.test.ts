import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { listProjectActivity } from "@/modules/projects/activity-service";
import { filterLearnerProjectActivity } from "@/modules/projects/learner-project-activity-filter-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
if (!process.env.TEST_DATABASE_URL) throw new Error("Requires disposable TEST_DATABASE_URL");
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const ids = {
  college:randomUUID(), learner:randomUUID(), membership:randomUUID(),
  department:randomUUID(),program:randomUUID(),period:randomUUID(),
  cohort:randomUUID(),enrollment:randomUUID(),
  role:randomUUID(), mentor:randomUUID(), mentorMembership:randomUUID(),
  mentorRole:randomUUID(), template:randomUUID(), version:randomUUID(),
  assignment:randomUUID(), project:randomUUID(), projectMember:randomUUID(),
  mentorProjectMember:randomUUID(),
  release:randomUUID(),sprint:randomUUID(),taskA:randomUUID(),taskB:randomUUID(),
};
const suffix = ids.college.slice(0,8);
const context:RequestContext={
  user:{id:ids.learner,identityUid:"chat7-learner-"+suffix,platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:ids.membership,collegeId:ids.college,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
async function setup() {
  await pool.query("insert into colleges(id,organization_id,name,code) values($1,$2,$3,$4)",
    [ids.college,SEED_IDS.organization,"Chat7 College "+suffix,"C7-"+suffix]);
  for(const [user,membership,role,roleName] of [
    [ids.learner,ids.membership,ids.role,"LEARNER"],
    [ids.mentor,ids.mentorMembership,ids.mentorRole,"MENTOR"],
  ]) {
    await pool.query("insert into users(id,identity_uid,display_name) values($1,$2,$3)",
      [user,"chat7-"+user,user===ids.mentor?"Own Mentor":"Own Learner"]);
    await pool.query("insert into college_memberships(id,user_id,college_id) values($1,$2,$3)",
      [membership,user,ids.college]);
    await pool.query("insert into membership_roles(id,membership_id,role) values($1,$2,$3)",
      [role,membership,roleName]);
  }
  // Produce all academic parentage locally, including the learner's enrollment.
  await pool.query("insert into departments(id,college_id,name) values($1,$2,'Own Project Test Department')",
    [ids.department,ids.college]);
  await pool.query(`insert into programs(id,department_id,name,code,duration_terms)
    values($1,$2,'Own Project Program',$3,8)`,
    [ids.program,ids.department,"P7-"+suffix]);
  await pool.query(`insert into academic_periods
    (id,college_id,name,code,start_date,end_date,status)
    values($1,$2,'Own Project Term',$3,'2026-07-01','2026-12-31','ACTIVE')`,
    [ids.period,ids.college,"T7-"+suffix]);
  await pool.query(`insert into cohorts(id,program_id,name,code,start_period_id,status)
    values($1,$2,'Own Project Cohort',$3,$4,'ACTIVE')`,
    [ids.cohort,ids.program,"B7-"+suffix,ids.period]);
  await pool.query(`insert into learner_program_enrollments
    (id,membership_id,program_id,cohort_id,status)
    values($1,$2,$3,$4,'ACTIVE')`,
    [ids.enrollment,ids.membership,ids.program,ids.cohort]);
  // Minimal project-template lineage is per-test and is not a shared seeded project.
  await pool.query(`insert into project_templates
    (id,slug,title,status,created_by_user_id) values ($1,$2,'Chat7 Template','PUBLISHED',$3)`,
    [ids.template,"chat7-"+suffix,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_template_versions
    (id,template_id,version,title,blueprint,created_by_user_id)
    values($1,$2,1,'Chat7 Template','{}'::jsonb,$3)`,
    [ids.version,ids.template,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_template_college_assignments
    (id,template_id,template_version_id,college_id,assigned_by_user_id)
    values($1,$2,$3,$4,$5)`,
    [ids.assignment,ids.template,ids.version,ids.college,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_instances
    (id,college_id,template_id,template_version_id,slug,title,created_by_user_id)
    values($1,$2,$3,$4,$5,'Chat7 own project',$6)`,
    [ids.project,ids.college,ids.template,ids.version,"chat7-own-"+suffix,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_members
    (id,project_id,membership_id,role,created_by_user_id)
    values($1,$2,$3,'LEARNER',$4)`,
    [ids.projectMember,ids.project,ids.membership,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_members
    (id,project_id,membership_id,role,is_primary,created_by_user_id)
    values($1,$2,$3,'MENTOR',true,$4)`,
    [ids.mentorProjectMember,ids.project,ids.mentorMembership,SEED_IDS.superAdminUser]);
}

beforeAll(async () => {
  await setup();
  for (const [eventType, collegeId] of [
    ["projects.sprint.updated", ids.college], ["projects.task.created", ids.college],
    ["projects.task.submitted", ids.college], ["projects.delivery.reviewed", ids.college], ["projects.sprint.updated", SEED_IDS.collegeB],
  ]) await pool.query(`INSERT INTO activity_events
    (id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary)
    VALUES($1,$2,$3,$4,'PROJECTS',$5,'project',$6,'Fixture activity')`,
    [randomUUID(),SEED_IDS.organization,collegeId,SEED_IDS.superAdminUser,eventType,ids.project]);
}, 45000);
afterAll(async () => {
  // Preserve append-only events and referenced identities; discard the entire isolated DB later.
  await pool.end(); await closeDatabaseConnection();
}, 30000);
describe("learner Project Activity categories over persisted own events", () => {
  it("includes only own-college Project events and composes category filtering", async () => {
    const events = await listProjectActivity(context, ids.project);
    expect(events).toHaveLength(4);
    expect(filterLearnerProjectActivity(events, "SPRINT").map(event => event.eventType)).toEqual(["projects.sprint.updated"]);
    expect(filterLearnerProjectActivity(events, "SUBMISSION").map(event => event.eventType)).toEqual(["projects.delivery.reviewed"]);
    expect(filterLearnerProjectActivity(events, "RESOURCE")).toEqual([]);
  });
  it("denies foreign-college, suspended and wrong-role contexts without returning data", async () => {
    for (const actor of [
      { ...context, membership: { ...context.membership!, collegeId: SEED_IDS.collegeB } },
      { ...context, membership: { ...context.membership!, status: "SUSPENDED" } },
      { ...context, membership: { ...context.membership!, roles: ["FACULTY"] } },
    ] as RequestContext[]) await expect(listProjectActivity(actor, ids.project)).rejects.toBeDefined();
    await expect(listProjectActivity(context, randomUUID())).rejects.toBeDefined();
  });
});
