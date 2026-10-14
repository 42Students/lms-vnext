import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { listMyLearnerProjectTeams } from "@/modules/projects/learner-project-team-service";
import { listMyLearnerProjectProgress } from "@/modules/projects/learner-project-progress-service";
import { learnerProjectListEmptyState } from "@/modules/projects/learner-project-list-empty-model";
import { learnerProjectMobileFilterSummary } from "@/modules/projects/learner-project-mobile-filter-model";
import { listMyProjectInstances } from "@/modules/projects/member-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Requires disposable TEST_DATABASE_URL");
}
const pool = new Pool({connectionString: process.env.TEST_DATABASE_URL, max:1});
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
async function cleanup() {
  await pool.query("delete from project_tasks where project_id=$1",[ids.project]);
  await pool.query("delete from project_sprints where project_id=$1",[ids.project]);
  await pool.query("delete from project_releases where project_id=$1",[ids.project]);
  await pool.query("delete from project_members where project_id=$1",[ids.project]);
  await pool.query("delete from project_instances where id=$1",[ids.project]);
  await pool.query("delete from project_template_college_assignments where id=$1",[ids.assignment]);
  await pool.query("delete from project_template_versions where id=$1",[ids.version]);
  await pool.query("delete from project_templates where id=$1",[ids.template]);
  await pool.query("delete from learner_program_enrollments where id=$1",[ids.enrollment]);
  await pool.query("delete from cohorts where id=$1",[ids.cohort]);
  await pool.query("delete from academic_periods where id=$1",[ids.period]);
  await pool.query("delete from programs where id=$1",[ids.program]);
  await pool.query("delete from departments where id=$1",[ids.department]);
  await pool.query("delete from membership_roles where membership_id=any($1::uuid[])",
    [[ids.membership,ids.mentorMembership]]);
  await pool.query("delete from college_memberships where id=any($1::uuid[])",
    [[ids.membership,ids.mentorMembership]]);
  await pool.query("delete from users where id=any($1::uuid[])",[[ids.learner,ids.mentor]]);
  await pool.query("delete from colleges where id=$1",[ids.college]);
}
let seeded=false;
beforeEach(async()=>{await setup();seeded=true;},45000);
afterEach(async()=>{if(seeded){await cleanup();seeded=false;}},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("L20-012 learner project team read (PostgreSQL)",()=>{
  it("returns the persisted team and mentor for an assigned learner",async()=>{
    const list=await listMyProjectInstances(context);
    expect(list.some(row=>row.project.id===ids.project)).toBe(true);
    expect(await listMyLearnerProjectTeams(context,[ids.project])).toEqual([{
      projectId:ids.project,mentorName:"Own Mentor",memberCount:2,
    }]);
  });
  it("does not leak foreign ids or accept suspended, wrong role or forged college contexts",async()=>{
    expect(await listMyLearnerProjectTeams(context,[randomUUID()])).toEqual([]);
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied){
      await expect(listMyLearnerProjectTeams(actor,[ids.project])).rejects.toBeDefined();
    }
  });
});

describe("L20-013 PostgreSQL task-progress read",()=>{
  it("uses persisted own project tasks without fabricating empty progress",async()=>{
    expect(await listMyLearnerProjectProgress(context,[ids.project])).toEqual([{
      projectId:ids.project,totalTasks:0,completedTasks:0,blockedTasks:0,percentage:null,
    }]);
    await pool.query("insert into project_releases(id,project_id,template_key,title,sequence) values($1,$2,'r-one','Release',0)",
      [ids.release,ids.project]);
    await pool.query("insert into project_sprints(id,project_id,release_id,template_key,title,sequence) values($1,$2,$3,'s-one','Sprint',0)",
      [ids.sprint,ids.project,ids.release]);
    await pool.query("insert into project_tasks(id,project_id,sprint_id,template_key,title,sequence,status) values($1,$2,$3,'a-one','Task A',0,'DONE'),($4,$2,$3,'b-one','Task B',1,'BLOCKED')",
      [ids.taskA,ids.project,ids.sprint,ids.taskB]);
    expect(await listMyLearnerProjectProgress(context,[ids.project])).toEqual([{
      projectId:ids.project,totalTasks:2,completedTasks:1,blockedTasks:1,percentage:50,
    }]);
  });
  it("does not reveal foreign ids and rejects forged college, suspension and wrong-role",async()=>{
    expect(await listMyLearnerProjectProgress(context,[randomUUID()])).toEqual([]);
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)
      await expect(listMyLearnerProjectProgress(actor,[ids.project])).rejects.toBeDefined();
  });
});

describe("L20-016 project list data-state read (PostgreSQL)",()=>{
  it("distinguishes a successful scoped project read from an empty search",async()=>{
    const rows=(await listMyProjectInstances(context)).filter(row=>row.memberRole==="LEARNER");
    expect(rows.some(row=>row.project.id===ids.project)).toBe(true);
    expect(learnerProjectListEmptyState(rows.length,rows.length).reason).toBe("HAS_RESULTS");
    const unmatched=rows.filter(row=>row.project.title==="Never-matches-this-project");
    expect(learnerProjectListEmptyState(rows.length,unmatched.length).reason).toBe("FILTERED_EMPTY");
  });
  it("does not classify an authorization error as an empty project state",async()=>{
    const suspended:RequestContext={
      ...context,membership:{...context.membership!,status:"SUSPENDED"},
    };
    await expect(listMyProjectInstances(suspended)).rejects.toBeDefined();
  });
});

describe("L20-017 persisted scoped Projects mobile filter inputs",()=>{
  it("offers real own-project state for mobile filter choices",async()=>{
    const assigned=(await listMyProjectInstances(context))
      .filter(row=>row.memberRole==="LEARNER");
    expect(assigned.some(row=>row.project.id===ids.project)).toBe(true);
    expect(learnerProjectMobileFilterSummary({status:"CURRENT",pageSize:25}))
      .toMatchObject({count:1,labels:["Current"]});
    expect(assigned.filter(row=>row.project.status!=="ARCHIVED" &&
      row.project.status!=="COMPLETED").map(row=>row.project.id)).toContain(ids.project);
  });
  it("does not surface a suspended learner's project list",async()=>{
    const denied:RequestContext={...context,
      membership:{...context.membership!,status:"SUSPENDED"}};
    await expect(listMyProjectInstances(denied)).rejects.toBeDefined();
  });
});
