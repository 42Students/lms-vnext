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
import { getProjectInstanceWorkspace } from "@/modules/projects/instance-service";
import { getProjectWorkspaceView,getProjectWorkspaceSectionView } from "@/modules/projects/workspace-view-service";
import { findOwnLearnerBoardTask } from "@/modules/projects/learner-board-task-detail-model";
import { getLearnerProjectGoals } from "@/modules/projects/learner-project-goals-service";
import { learnerBoardCardMetadata } from "@/modules/projects/learner-board-card-model";
import { learnerProjectArchiveState } from "@/modules/projects/learner-project-archive-model";
import { canonicalLearnerProjectTab } from "@/modules/projects/learner-project-tab-alias-model";
import { learnerProjectReadFailureDisposition } from "@/modules/projects/learner-project-detail-error-model";
import { filterLearnerBoardTasks, learnerBoardEmptyState, learnerBoardActiveFilterCount } from "@/modules/projects/learner-project-board-model";
import { SEED_IDS } from "../../scripts/db-seed-data";

function boardTasks<T extends { sprintId: string | null }>(tasks: readonly T[]) {
  return tasks.map(task => ({ ...task, sprintId: task.sprintId ?? undefined }));
}

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
  // Template revisions are permanent history under DB070. Share this file's
  // unique version across tests, and create the header plus its initial
  // snapshot in ONE transaction for DB071's deferred header FK.
  const existingTemplate = await pool.query("select 1 from project_templates where id=$1", [ids.template]);
  if (existingTemplate.rowCount === 0) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`insert into project_templates
        (id,slug,title,status,created_by_user_id) values ($1,$2,'Chat7 Template','PUBLISHED',$3)`,
        [ids.template,"chat7-"+suffix,SEED_IDS.superAdminUser]);
      await client.query(`insert into project_template_versions
        (id,template_id,version,title,blueprint,created_by_user_id)
        values($1,$2,1,'Chat7 Template',$3::jsonb,$4)`,
        [ids.version,ids.template,
          JSON.stringify({overview:{goal:"Build service",deliverables:["Release code"]}}),
          SEED_IDS.superAdminUser]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  await pool.query(`insert into project_template_college_assignments
    (id,template_id,template_version_id,college_id,assigned_by_user_id)
    values($1,$2,$3,$4,$5)`,
    [ids.assignment,ids.template,ids.version,ids.college,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_instances
    (id,college_id,template_id,template_version_id,slug,title,created_by_user_id)
    values($1,$2,$3,$4,$5,'Chat7 own project',$6)`,
    [ids.project,ids.college,ids.template,ids.version,"chat7-own-"+suffix,SEED_IDS.superAdminUser]);
  // vNext access is role_kind + can_mutate, not just the old role label.
  // Explicitly seed a writable learner and mentor instead of depending on
  // migration defaults that can resolve to read-only OBSERVER access.
  await pool.query(`insert into project_members
    (id,project_id,membership_id,role,role_kind,can_mutate,created_by_user_id)
    values($1,$2,$3,'LEARNER','LEARNER',true,$4)`,
    [ids.projectMember,ids.project,ids.membership,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_members
    (id,project_id,membership_id,role,role_kind,can_mutate,is_primary,created_by_user_id)
    values($1,$2,$3,'MENTOR','MENTOR',true,true,$4)`,
    [ids.mentorProjectMember,ids.project,ids.mentorMembership,SEED_IDS.superAdminUser]);
}
async function cleanup() {
  await pool.query("delete from project_tasks where project_id=$1",[ids.project]);
  await pool.query("delete from project_sprints where project_id=$1",[ids.project]);
  await pool.query("delete from project_releases where project_id=$1",[ids.project]);
  await pool.query("delete from project_members where project_id=$1",[ids.project]);
  await pool.query("delete from project_instances where id=$1",[ids.project]);
  await pool.query("delete from project_template_college_assignments where id=$1",[ids.assignment]);
  // Never destroy DB070 append-only revisions or their DB071 parent headers.
  // The file-level UUIDs are unique, so retained history cannot collide with
  // another test process or a later independent disposable database run.
  const retention = await pool.query<{ retainHistory: boolean }>(
    "select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
    "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
    "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
    "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"",
  );
  if (!retention.rows[0]?.retainHistory) {
    await pool.query("delete from project_template_versions where id=$1",[ids.version]);
    await pool.query("delete from project_templates where id=$1",[ids.template]);
  }
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

describe("L25-006 own persisted task Board search",()=>{
  it("filters only the persisted task from its own authorized project",async()=>{
    await pool.query("insert into project_releases(id,project_id,template_key,title,sequence) values($1,$2,'search-release','Release',0)",
      [ids.release,ids.project]);
    await pool.query("insert into project_sprints(id,project_id,release_id,template_key,title,sequence) values($1,$2,$3,'search-sprint','Sprint',0)",
      [ids.sprint,ids.project,ids.release]);
    await pool.query("insert into project_tasks(id,project_id,sprint_id,template_key,title,description,sequence) values($1,$2,$3,'search-task','Build unit checks','Own acceptance',0)",
      [ids.taskA,ids.project,ids.sprint]);
    const workspace=await getProjectInstanceWorkspace(context,ids.project);
    expect(filterLearnerBoardTasks(boardTasks(workspace.tasks),"acceptance").map(task=>task.id))
      .toEqual([ids.taskA]);
    expect(filterLearnerBoardTasks(boardTasks(workspace.tasks),"another")).toEqual([]);
  });
  it("denies foreign college, suspended and wrong-role actors",async()=>{
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["MENTOR"]}},
    ];
    for(const actor of denied)
      await expect(getProjectInstanceWorkspace(actor,ids.project)).rejects.toBeDefined();
  });
});

describe("L25-002 learner priority filter from own persisted task rows",()=>{
  it("only returns actual high priority tasks from own workspace",async()=>{
    await pool.query("insert into project_releases(id,project_id,template_key,title,sequence) values($1,$2,'priority-release','Release',0)",[ids.release,ids.project]);
    await pool.query("insert into project_sprints(id,project_id,release_id,template_key,title,sequence) values($1,$2,$3,'priority-sprint','Sprint',0)",[ids.sprint,ids.project,ids.release]);
    await pool.query("insert into project_tasks(id,project_id,sprint_id,template_key,title,sequence,priority) values($1,$2,$3,'priority-a','Own high task',0,'HIGH'),($4,$2,$3,'priority-b','Own low task',1,'LOW')",[ids.taskA,ids.project,ids.sprint,ids.taskB]);
    const workspace=await getProjectInstanceWorkspace(context,ids.project);
    expect(filterLearnerBoardTasks(boardTasks(workspace.tasks),"",{priority:"HIGH"}).map(task=>task.id)).toEqual([ids.taskA]);
    for(const denied of [
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["MENTOR"]}},
    ] as RequestContext[]) await expect(getProjectInstanceWorkspace(denied,ids.project)).rejects.toBeDefined();
  });
});

describe("L25-003 Board sprint filter from persisted assigned project",()=>{
  it("uses learner-owned sprint ids only with task state and does not leak another sprint",async()=>{
    await pool.query("insert into project_releases(id,project_id,template_key,title,sequence) values($1,$2,'sprint-release','Release',0)",[ids.release,ids.project]);
    await pool.query("insert into project_sprints(id,project_id,release_id,template_key,title,sequence) values($1,$2,$3,'sprint-a','Sprint A',0)",[ids.sprint,ids.project,ids.release]);
    await pool.query("insert into project_tasks(id,project_id,sprint_id,template_key,title,sequence,status) values($1,$2,$3,'sprint-task','Task',0,'TODO')",[ids.taskA,ids.project,ids.sprint]);
    const workspace=await getProjectInstanceWorkspace(context,ids.project);
    expect(filterLearnerBoardTasks(boardTasks(workspace.tasks),"",{sprintId:ids.sprint}).map(task=>task.id)).toEqual([ids.taskA]);
    expect(filterLearnerBoardTasks(boardTasks(workspace.tasks),"",{sprintId:randomUUID()})).toEqual([]);
    for(const actor of [
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ] as RequestContext[]) await expect(getProjectInstanceWorkspace(actor,ids.project)).rejects.toBeDefined();
  });
});

describe("L25-005 authorized learner Board release filter",()=>{
  it("scopes persisted tasks through their sprint-to-release linkage",async()=>{
    await pool.query("insert into project_releases(id,project_id,template_key,title,sequence) values($1,$2,'release-filter','Release',0)",[ids.release,ids.project]);
    await pool.query("insert into project_sprints(id,project_id,release_id,template_key,title,sequence) values($1,$2,$3,'release-sprint','Sprint',0)",[ids.sprint,ids.project,ids.release]);
    await pool.query("insert into project_tasks(id,project_id,sprint_id,template_key,title,sequence) values($1,$2,$3,'release-task','Task',0)",[ids.taskA,ids.project,ids.sprint]);
    const workspace=await getProjectInstanceWorkspace(context,ids.project);
    const links=new Map(workspace.sprints.map(sprint=>[sprint.id,sprint.releaseId]));
    expect(filterLearnerBoardTasks(boardTasks(workspace.tasks),"",{releaseId:ids.release,
      sprintReleaseById:links}).map(task=>task.id)).toEqual([ids.taskA]);
    expect(filterLearnerBoardTasks(boardTasks(workspace.tasks),"",{releaseId:randomUUID(),
      sprintReleaseById:links})).toEqual([]);
    for(const denied of [
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ] as RequestContext[]) await expect(getProjectInstanceWorkspace(denied,ids.project)).rejects.toBeDefined();
  });
});

describe("L25-013 source-backed empty Board on own learner project",()=>{
  it("distinguishes no tasks and successful empty filter on authorized workspace read",async()=>{
    const empty=await getProjectInstanceWorkspace(context,ids.project);
    expect(learnerBoardEmptyState(empty.tasks.length,empty.tasks.length)).toBe("NO_TASKS");
    await pool.query("insert into project_releases(id,project_id,template_key,title,sequence) values($1,$2,'empty-release','Release',0)",[ids.release,ids.project]);
    await pool.query("insert into project_sprints(id,project_id,release_id,template_key,title,sequence) values($1,$2,$3,'empty-sprint','Sprint',0)",[ids.sprint,ids.project,ids.release]);
    await pool.query("insert into project_tasks(id,project_id,sprint_id,template_key,title,sequence) values($1,$2,$3,'empty-task','Persisted Task',0)",[ids.taskA,ids.project,ids.sprint]);
    const populated=await getProjectInstanceWorkspace(context,ids.project);
    expect(learnerBoardEmptyState(populated.tasks.length,
      filterLearnerBoardTasks(boardTasks(populated.tasks),"nonexistent").length)).toBe("FILTERED_EMPTY");
    for(const denied of [
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ] as RequestContext[]) await expect(getProjectInstanceWorkspace(denied,ids.project)).rejects.toBeDefined();
  });
});

describe("L25-014 responsive Board filters use own task data",()=>{
  it("shows truthful counts from an authorized project snapshot",async()=>{
    const workspace=await getProjectInstanceWorkspace(context,ids.project);
    expect(workspace.project.id).toBe(ids.project);
    expect(learnerBoardActiveFilterCount({search:"",priority:"",sprintId:"",releaseId:""})).toBe(0);
    for(const actor of [
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ] as RequestContext[]) await expect(getProjectInstanceWorkspace(actor,ids.project)).rejects.toBeDefined();
  });
});

describe("L25-008 exact task-detail selection from learner own persisted workspace",()=>{
  it("opens own task details and denies forged task selectors",async()=>{
    await pool.query("insert into project_releases(id,project_id,template_key,title,sequence) values($1,$2,'drawer-release','Release',0)",[ids.release,ids.project]);
    await pool.query("insert into project_sprints(id,project_id,release_id,template_key,title,sequence) values($1,$2,$3,'drawer-sprint','Sprint',0)",[ids.sprint,ids.project,ids.release]);
    await pool.query("insert into project_tasks(id,project_id,sprint_id,template_key,title,description,acceptance_criteria,sequence) values($1,$2,$3,'drawer-task','Own task','Owned scope','Must pass',0)",[ids.taskA,ids.project,ids.sprint]);
    const workspace=await getProjectInstanceWorkspace(context,ids.project);
    expect(findOwnLearnerBoardTask(workspace.tasks,ids.taskA)).toMatchObject({
      id:ids.taskA,title:"Own task",acceptanceCriteria:"Must pass",
    });
    expect(findOwnLearnerBoardTask(workspace.tasks,randomUUID())).toBeNull();
    for(const actor of [
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ] as RequestContext[]) await expect(getProjectInstanceWorkspace(actor,ids.project)).rejects.toBeDefined();
  });
});

describe("L21-012 protected learner Project detail read",()=>{
  it("loads own workspace and hides missing or foreign identifiers",async()=>{
    expect((await getProjectInstanceWorkspace(context,ids.project)).project.id).toBe(ids.project);
    await expect(getProjectInstanceWorkspace(context,randomUUID())).rejects.toMatchObject({
      code:"PROJECT_NOT_FOUND",
    });
    expect(learnerProjectReadFailureDisposition("PROJECT_NOT_FOUND")).toBe("NOT_FOUND");
    for(const actor of [
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ] as RequestContext[]) await expect(getProjectInstanceWorkspace(actor,ids.project)).rejects.toMatchObject({
      code:"PROJECT_ACCESS_DENIED",
    });
  });
});

describe("L22-002 authored project Overview from own immutable template version",()=>{
  it("loads only the learner-assigned persisted template-version goals",async()=>{
    expect(await getLearnerProjectGoals(context,ids.project)).toMatchObject({
      goal:"Build service",deliverables:["Release code"],
    });
    for(const actor of [
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ] as RequestContext[]) await expect(getLearnerProjectGoals(actor,ids.project)).rejects.toBeDefined();
    await expect(getLearnerProjectGoals(context,randomUUID())).rejects.toBeDefined();
  });
});

describe("L21-008 compatibility tab for authorized Project",()=>{
  it("resolves legacy tasks to the same own Board without affecting authorization",async()=>{
    expect(canonicalLearnerProjectTab("tasks")).toBe("board");
    expect((await getProjectInstanceWorkspace(context,ids.project)).project.id).toBe(ids.project);
    for(const actor of [
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ] as RequestContext[]) await expect(getProjectInstanceWorkspace(actor,ids.project)).rejects.toBeDefined();
  });
});

describe("L21-009 protected meeting alias",()=>{
  it("resolves only the authorized Project",async()=>{
    expect(canonicalLearnerProjectTab("meetings")).toBe("team");
    expect((await getProjectInstanceWorkspace(context,ids.project)).project.id).toBe(ids.project);
    await expect(getProjectInstanceWorkspace({...context,membership:{...context.membership!,status:"SUSPENDED"}},ids.project)).rejects.toBeDefined();
    await expect(getProjectInstanceWorkspace({...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},ids.project)).rejects.toBeDefined();
    await expect(getProjectInstanceWorkspace({...context,membership:{...context.membership!,roles:["FACULTY"]}},ids.project)).rejects.toBeDefined();
  });
});

describe("L25-007 learner Board persisted task context",()=>{
  it("reads correct task/status/priority/sprint from an authorized project",async()=>{
    await pool.query("insert into project_releases(id,project_id,template_key,title,sequence) values($1,$2,'card-release','Release',0)",[ids.release,ids.project]);
    await pool.query("insert into project_sprints(id,project_id,release_id,template_key,title,sequence) values($1,$2,$3,'card-sprint','Own Sprint',0)",[ids.sprint,ids.project,ids.release]);
    await pool.query("insert into project_tasks(id,project_id,sprint_id,template_key,title,sequence,status,priority) values($1,$2,$3,'card-task','Own Task',0,'IN_PROGRESS','HIGH')",[ids.taskA,ids.project,ids.sprint]);
    const own=await getProjectInstanceWorkspace(context,ids.project);
    const task=own.tasks.find(row=>row.id===ids.taskA);
    if(!task)throw new Error("Expected own fixture task");
    expect(learnerBoardCardMetadata({...task,sprintId:task.sprintId ?? ""},own.sprints)).toMatchObject({title:"Own Task",status:"IN PROGRESS",priority:"HIGH",sprintTitle:"Own Sprint"});
    await expect(getProjectInstanceWorkspace({...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},ids.project)).rejects.toBeDefined();
    await expect(getProjectInstanceWorkspace({...context,membership:{...context.membership!,status:"SUSPENDED"}},ids.project)).rejects.toBeDefined();
    await expect(getProjectInstanceWorkspace({...context,membership:{...context.membership!,roles:["FACULTY"]}},ids.project)).rejects.toBeDefined();
  });
});

describe("L21-010 exact learner final delivery tab",()=>{
  it("loads the own project final-delivery read behind canonical tab",async()=>{
    // chat-11 exact-tabs: Final delivery is reached from Overview via ?tab=delivery, not a tab-strip entry.
    expect(canonicalLearnerProjectTab("delivery")).toBe("delivery");
    const workspace=await getProjectWorkspaceView(context,ids.project);
    expect(workspace.project.id).toBe(ids.project);
    expect(workspace.finalDelivery.submissions).toEqual([]);
    // Learners may read their delivery, but internal rubric evaluations are not published.
    expect(workspace.evaluation).toEqual({evaluations:[],items:[]});
    const ownDelivery=await getProjectWorkspaceSectionView(context,ids.project,"DELIVERY");
    expect(ownDelivery.finalDelivery.submissions).toEqual([]);
    expect(ownDelivery.evaluation).toEqual({evaluations:[],items:[]});
    await expect(getProjectWorkspaceView({...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},ids.project)).rejects.toBeDefined();
    await expect(getProjectWorkspaceView({...context,membership:{...context.membership!,status:"SUSPENDED"}},ids.project)).rejects.toBeDefined();
    await expect(getProjectWorkspaceView({...context,membership:{...context.membership!,roles:["FACULTY"]}},ids.project)).rejects.toBeDefined();
  });
});

describe("L20-014 archived own Project list card",()=>{
  it("reflects only persisted archive state and preserves learner scope",async()=>{
    await pool.query("update project_instances set status='ARCHIVED' where id=$1",[ids.project]);
    const own=await listMyProjectInstances(context);
    const status=own.find(row=>row.project.id===ids.project)?.project.status;
    expect(status).toBe("ARCHIVED");
    expect(learnerProjectArchiveState(status!).readOnly).toBe(true);
    await expect(listMyProjectInstances({...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}})).rejects.toBeDefined();
    await expect(listMyProjectInstances({...context,membership:{...context.membership!,status:"SUSPENDED"}})).rejects.toBeDefined();
    await expect(listMyLearnerProjectProgress({...context,membership:{...context.membership!,roles:["FACULTY"]}},[ids.project])).rejects.toBeDefined();
  });
});
