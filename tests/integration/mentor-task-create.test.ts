import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {addProjectMember} from "@/modules/projects/member-service";
import {createProjectInstance,getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege} from "@/modules/projects/template-service";
import {createMentorProjectTask} from "@/modules/projects/mentor-task-create-service";
import {getMentorTeamMeetings} from "@/modules/projects/mentor-team-meetings-service";
import {getMentorPortfolioActivity} from "@/modules/projects/mentor-portfolio-service";
import {mentorPortfolioActivityCsv} from "@/modules/projects/mentor-portfolio-activity-export-model";
import {getProjectWorkspaceView} from "@/modules/projects/workspace-view-service";
import {getMentorProjectTimeline} from "@/modules/projects/mentor-project-timeline-service";

if(!process.env.TEST_DATABASE_URL)throw new Error(
  "Mentor create test requires isolated disposable TEST_DATABASE_URL",
);
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const root:RequestContext={
  user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:null,
};
const scopedRoot:RequestContext={...root,adminScope:{
  organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
}};
const admin:RequestContext={
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const mentor:RequestContext={
  user:{id:SEED_IDS.facultyUser,identityUid:"seed-shared-faculty",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["MENTOR","FACULTY"]},
};
const learner:RequestContext={
  user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
const tracked:{projects:string[];templates:string[]}={projects:[],templates:[]};
async function cleanup(){
  // Immutable activity_events are intentionally retained: no deletion from append-only audit tables.
  if(tracked.projects.length){
    // This disposable fixture owns the meeting and its database-captured history.
    // Delete the fixture's history before deleting the FK-restricted meeting;
    // production mutation paths must never purge the audit trail.
    await pool.query("delete from project_meeting_history where project_id=any($1::uuid[])",[tracked.projects]);
    for(const table of [
      "project_task_submissions","project_submission_reviews","project_submissions",
      "project_meeting_history","project_meetings","project_members","project_resources","project_resource_audit",
      "project_tasks","project_sprints","project_releases",
    ]){
      await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[tracked.projects]);
    }
    await pool.query("delete from project_instances where id=any($1::uuid[])",[tracked.projects]);
    tracked.projects=[];
  }
  if(tracked.templates.length){
    // DB070 forbids rewriting or deleting template revision history. DB071
    // also anchors header pointers to those immutable revisions. Keep the
    // generated fixtures in disposable databases instead of disabling guards.
    const retention=await pool.query<{retainHistory:boolean}>(
      "select (exists (select 1 from pg_trigger " +
        "where tgrelid='project_template_versions'::regclass " +
        "and tgname='db07_project_template_versions_append_only' " +
        "and tgenabled='O' and not tgisinternal) " +
        "or exists (select 1 from pg_constraint " +
        "where conrelid='project_templates'::regclass " +
        "and conname in ('project_templates_current_version_snapshot_fk', " +
        "'project_templates_published_version_snapshot_fk'))) as \"retainHistory\"",
    );
    if(!retention.rows[0]?.retainHistory){
      await pool.query("delete from project_template_college_assignments where template_id=any($1::uuid[])",[tracked.templates]);
      await pool.query("delete from project_template_versions where template_id=any($1::uuid[])",[tracked.templates]);
      await pool.query("delete from project_templates where id=any($1::uuid[])",[tracked.templates]);
    }
    tracked.templates=[];
  }
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});

async function fixture(){
  const suffix=randomUUID().replaceAll("-","").slice(0,16);
  const created=await createProjectTemplate(root,{
    slug:"chat4-create-task-"+suffix,title:"Isolated task "+suffix,
    blueprint:{
      overview:{goal:"Build a task",deliverables:["Task"]},
      releases:[{key:"release-a",title:"Release",sequence:0}],
      sprints:[{key:"sprint-a",releaseKey:"release-a",title:"Sprint",sequence:0}],
      tasks:[{key:"task-a",sprintKey:"sprint-a",title:"Seeded template task",priority:"MEDIUM" as const,sequence:0}],resources:[],
    },
  });
  tracked.templates.push(created.template.id);
  await publishProjectTemplate(root,created.template.id);
  await assignProjectTemplateToCollege(scopedRoot,created.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{
    collegeId:SEED_IDS.collegeA,templateId:created.template.id,
    slug:"chat4-create-project-"+suffix,title:"Unique task project "+suffix,
  });
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{
    membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",isPrimary:true,
  });
  await addProjectMember(admin,project.id,{
    membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
  });
  const workspace=await getProjectInstanceWorkspace(mentor,project.id);
  const sprint=workspace.sprints[0];
  if(!sprint)throw new Error("Fixture missing registered sprint");
  return {project,sprint};
}
describe("Mentor task create — migrated PostgreSQL",()=>{
  it("reads recorded project events from active Mentor assignment with safe CSV and foreign denial",async()=>{
    const {project}=await fixture();
    const existing=await getMentorPortfolioActivity(mentor,{
      projectId:project.id,view:"PROJECT",window:"PAST_90_DAYS",page:1,pageSize:50,
    });
    expect(existing.enabled).toBe(true);
    expect(existing.items).toEqual(expect.arrayContaining([
      expect.objectContaining({projectId:project.id,label:"Project created"}),
    ]));
    expect(existing.items.every(row=>row.projectId===project.id)).toBe(true);
    const noMatch=await getMentorPortfolioActivity(mentor,{
      projectId:project.id,search:"a-title-that-is-not-this-project",
    });
    expect(noMatch.total).toBe(0);
    const csv=mentorPortfolioActivityCsv(existing.items,0);
    expect(csv).toContain("Project created");
    expect(csv).not.toContain("actor_user_id");
    expect(csv).not.toContain("identityUid");
    await expect(getMentorPortfolioActivity(learner,{
      projectId:project.id,view:"PROJECT",
    })).rejects.toBeDefined();
    const foreign:RequestContext={...mentor,membership:{
      ...mentor.membership!,id:SEED_IDS.facultyCollegeBMembership,
      collegeId:SEED_IDS.collegeB,
    }};
    await expect(getMentorPortfolioActivity(foreign,{
      projectId:project.id,view:"PROJECT",
    })).rejects.toBeDefined();
  });

  it("derives Mentor evidence from real persisted Project tasks, roster and versioned data",async()=>{
    const {project,sprint}=await fixture();
    const first=await getProjectWorkspaceView(mentor,project.id);
    expect(first.mentorEvidence.team).toEqual({
      learners:1,mentors:1,primaryMentors:1,
    });
    expect(first.mentorEvidence.tasksBySprint[sprint.id])
      .toMatchObject({total:1,done:0,blocked:0,inReview:0,completionPercent:0});
    expect(first.mentorEvidence.latestDelivery).toBeNull();

    await createMentorProjectTask(mentor,{projectId:project.id},{
      sprintId:sprint.id,title:"Evidence task",description:null,
      acceptanceCriteria:"Demonstrate an authorized review",priority:"HIGH",
      expectedSprintUpdatedAt:sprint.updatedAt.toISOString(),
    });
    const updated=await getProjectWorkspaceView(mentor,project.id);
    expect(updated.mentorEvidence.tasksBySprint[sprint.id])
      .toMatchObject({total:2,done:0,completionPercent:0});
    const foreign:RequestContext={...mentor,membership:{
      ...mentor.membership!,id:SEED_IDS.facultyCollegeBMembership,
      collegeId:SEED_IDS.collegeB,
    }};
    await expect(getProjectWorkspaceView(foreign,project.id)).rejects.toBeDefined();
  });

  it("reads registered Release/Sprint timeline and denies other roles and colleges",async()=>{
    const {project}=await fixture();
    const view=await getMentorProjectTimeline(mentor,{projectId:project.id});
    expect(view).toMatchObject({enabled:true,total:1,page:1,
      items:[{status:"PLANNED",sprints:[{
        status:"PLANNED",taskCount:1,doneCount:0,progressPercent:0,
      }]}],
    });
    const shipped=await getMentorProjectTimeline(mentor,{
      projectId:project.id,releaseStatus:"SHIPPED",
    });
    expect(shipped.items).toEqual([]);
    await expect(getMentorProjectTimeline(learner,{projectId:project.id}))
      .rejects.toBeDefined();
    await expect(getMentorProjectTimeline(mentor,{projectId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    await expect(getMentorProjectTimeline(mentor,{
      projectId:project.id,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });

  it("reads actual team counts and one registered requested meeting",async()=>{
    const {project}=await fixture();
    const meetingId=randomUUID();
    await pool.query(`insert into project_meetings
      (id,project_id,status,meeting_type,title,starts_at,ends_at,time_zone,
       requested_by_membership_id,created_by_user_id)
       values ($1,$2,'REQUESTED','GENERAL',$3,
        '2026-11-01T10:00:00Z','2026-11-01T11:00:00Z','Asia/Kolkata',$4,$5)`,[
      meetingId,project.id,"Unique Mentor meeting",
      SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser,
    ]);
    const view=await getMentorTeamMeetings(mentor,{projectId:project.id});
    expect(view).toMatchObject({
      enabled:true,total:1,
      team:{learners:1,mentors:1,primaryRecorded:true},
    });
    expect(view.items).toEqual(expect.arrayContaining([
      expect.objectContaining({id:meetingId,status:"REQUESTED",hasOutcome:false}),
    ]));
    const completed=await getMentorTeamMeetings(mentor,{
      projectId:project.id,status:"COMPLETED",
    });
    expect(completed.items).toEqual([]);
    expect(completed.total).toBe(0);
    await expect(getMentorTeamMeetings(learner,{projectId:project.id}))
      .rejects.toBeDefined();
    await expect(getMentorTeamMeetings(mentor,{projectId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    await expect(getMentorTeamMeetings(mentor,{
      projectId:project.id,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });

  it("creates assigned tasks only for a currently active learner in the same project",async()=>{
    const {project,sprint}=await fixture();
    const params={projectId:project.id};
    const input={
      sprintId:sprint.id,title:"Assigned only to active member",
      description:null,acceptanceCriteria:"Check project learner grant",
      priority:"MEDIUM" as const,assigneeMembershipId:SEED_IDS.learnerCollegeAMembership,
      expectedSprintUpdatedAt:sprint.updatedAt.toISOString(),
    };
    const created=await createMentorProjectTask(mentor,params,input);
    expect(created).toMatchObject({
      projectId:project.id,assigneeMembershipId:SEED_IDS.learnerCollegeAMembership,
    });
    // End the learner's membership in this specific project only. A stale
    // request cannot reuse a formerly authorized assignee even with a fresh
    // sprint token. The service locks the checked membership rows FOR SHARE.
    await pool.query(
      "UPDATE project_members SET ended_at=now() WHERE project_id=$1 AND membership_id=$2",
      [project.id,SEED_IDS.learnerCollegeAMembership],
    );
    const token=await pool.query<{updated_at:Date}>(
      "SELECT updated_at FROM project_sprints WHERE id=$1",[sprint.id],
    );
    await expect(createMentorProjectTask(mentor,params,{
      ...input,title:"Revoked learner should not be assigned",
      expectedSprintUpdatedAt:token.rows[0]!.updated_at.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_MEMBER_ROLE_REQUIRED"});
    const tasks=await pool.query<{title:string}>(
      "SELECT title FROM project_tasks WHERE project_id=$1 ORDER BY sequence",[project.id],
    );
    expect(tasks.rows.map(row=>row.title)).not.toContain("Revoked learner should not be assigned");
  });

  it("creates a TODO task exactly once, audits and rejects forged/foreign/stale writes",async()=>{
    const {project,sprint}=await fixture();
    const params={projectId:project.id};
    const input={
      sprintId:sprint.id,title:"Unique Mentor task",description:"No fake assignee",
      acceptanceCriteria:"Submitted review",priority:"HIGH" as const,
      expectedSprintUpdatedAt:sprint.updatedAt.toISOString(),
    };
    const created=await createMentorProjectTask(mentor,params,input);
    expect(created).toMatchObject({
      projectId:project.id,sprintId:sprint.id,title:input.title,
      priority:"HIGH",status:"TODO",sequence:1,
    });
    const saved=await pool.query<{id:string}>(
      "select id from project_tasks where project_id=$1 and id=$2",[project.id,created.id],
    );
    expect(saved.rows).toHaveLength(1);
    const audit=await pool.query<{event_type:string;actor_user_id:string}>(
      "select event_type,actor_user_id from activity_events where subject_type='project_task' and subject_id=$1 and event_type='projects.task.created'",
      [created.id],
    );
    expect(audit.rows).toEqual([{event_type:"projects.task.created",actor_user_id:mentor.user.id}]);
    await expect(createMentorProjectTask(mentor,params,input))
      .rejects.toBeDefined();
    await expect(createMentorProjectTask(learner,params,{
      ...input,expectedSprintUpdatedAt:new Date().toISOString(),
    })).rejects.toBeDefined();
    await expect(createMentorProjectTask(mentor,{projectId:SEED_IDS.collegeB},input))
      .rejects.toBeDefined();
    await expect(createMentorProjectTask(mentor,params,{
      ...input,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    const count=await pool.query<{total:number}>(
      "select count(*)::int as total from project_tasks where project_id=$1",[project.id],
    );
    expect(count.rows[0]?.total).toBe(2);
  });
});
