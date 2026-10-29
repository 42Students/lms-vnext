import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { addProjectMember } from "@/modules/projects/member-service";
import {
  createProjectInstance, getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";
import {
  createProjectTemplate, publishProjectTemplate, assignProjectTemplateToCollege,
} from "@/modules/projects/template-service";
import { updateMentorSprintDetails } from "@/modules/projects/mentor-sprint-details-service";
import {createMentorProjectTask} from "@/modules/projects/mentor-task-create-service";
import {writeMentorProjectRelease} from "@/modules/projects/mentor-release-write-service";
import { getMentorSprintProgress } from "@/modules/projects/mentor-sprint-progress-service";
import {
  createMentorProjectSprint, transitionMentorProjectSprint,
} from "@/modules/projects/mentor-sprint-write-service";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Requires a migrated and seeded disposable TEST_DATABASE_URL; never use DATABASE_URL");
}
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
const tracked:{projectIds:string[];templateIds:string[]}={projectIds:[],templateIds:[]};

async function cleanup() {
  const projectIds=[...tracked.projectIds];
  const templateIds=[...tracked.templateIds];
  const allIds=[...projectIds,...templateIds];
  if(allIds.length) {
    // Fully clean project AND template audit/notification rows owned by this fixture.
    await pool.query(`delete from in_app_notifications where event_id in
      (select id from activity_events where subject_id = any($1::text[])
        or metadata ->> 'projectId' = any($1::text[])
        or metadata ->> 'templateId' = any($1::text[]))`,[allIds]);
    await pool.query(`delete from activity_events where subject_id = any($1::text[])
      or metadata ->> 'projectId' = any($1::text[])
      or metadata ->> 'templateId' = any($1::text[])`,[allIds]);
  }
  if(projectIds.length) {
    for(const table of [
      "project_task_submissions","project_submission_reviews","project_submissions",
      "project_meetings","project_members","project_resources",
      "project_tasks","project_sprints","project_releases",
    ]) {
      await pool.query("delete from "+table+" where project_id = any($1::uuid[])",[projectIds]);
    }
    await pool.query("delete from project_instances where id = any($1::uuid[])",[projectIds]);
    tracked.projectIds=[];
  }
  if(templateIds.length) {
    await pool.query("delete from project_template_college_assignments where template_id = any($1::uuid[])",[templateIds]);
    await pool.query("delete from project_template_versions where template_id = any($1::uuid[])",[templateIds]);
    await pool.query("delete from project_templates where id = any($1::uuid[])",[templateIds]);
    tracked.templateIds=[];
  }
}
afterEach(cleanup);
afterAll(async()=>{
  try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}
});
function blueprint() {
  return {
    overview:{goal:"Edit sprint details only",deliverables:["Review changes"]},
    releases:[{key:"release-1",title:"Unique Release",sequence:0}],
    sprints:[{key:"sprint-1",releaseKey:"release-1",title:"Original Sprint",description:"Before edit",sequence:0}],
    tasks:[{key:"task-1",sprintKey:"sprint-1",title:"Existing Task",priority:"HIGH" as const,sequence:0}],
    resources:[],
  };
}
async function fixture() {
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const created=await createProjectTemplate(root,{
    slug:"chat4-edit-t-"+suffix,title:"Isolated Sprint Edit "+suffix,blueprint:blueprint(),
  });
  tracked.templateIds.push(created.template.id);
  await publishProjectTemplate(root,created.template.id);
  await assignProjectTemplateToCollege(scopedRoot,created.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{
    collegeId:SEED_IDS.collegeA,templateId:created.template.id,
    slug:"chat4-edit-p-"+suffix,title:"Isolated Project "+suffix,
  });
  tracked.projectIds.push(project.id);
  await addProjectMember(admin,project.id,{
    membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
  });
  await addProjectMember(admin,project.id,{
    membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",isPrimary:true,
  });
  const workspace=await getProjectInstanceWorkspace(mentor,project.id);
  return {project,sprint:workspace.sprints[0]!};
}

describe("Mentor sprint details PATCH: fresh PostgreSQL positive, audit, denial",()=>{
  it("writes registered fields, audits exactly once and denies forged/foreign/stale updates",async()=>{
    const {project,sprint:createdSprint}=await fixture();
    // The database preserves sub-millisecond precision, but Drizzle/JS Date
    // reads only milliseconds. Force this precision mismatch on every fresh
    // database run instead of relying on timing luck.
    await pool.query(`update project_sprints
      set updated_at = date_trunc('milliseconds', updated_at) + interval '321 microseconds'
      where id = $1`,[createdSprint.id]);
    const precise=await pool.query<{fraction:string}>(`select
      to_char(updated_at at time zone 'UTC','US') as fraction
      from project_sprints where id = $1`,[createdSprint.id]);
    expect(precise.rows[0]?.fraction).toMatch(/321$/);
    const beforeEdit=await getProjectInstanceWorkspace(mentor,project.id);
    const sprint=beforeEdit.sprints.find(row=>row.id===createdSprint.id);
    expect(sprint).toBeDefined();
    if(!sprint) throw new Error("Fixture sprint is missing after timestamp normalization");
    expect(sprint.updatedAt.getTime()).toBe(createdSprint.updatedAt.getTime());
    const original=sprint.updatedAt.toISOString();
    const params={projectId:project.id,sprintId:sprint.id};
    const edited=await updateMentorSprintDetails(mentor,params,{
      title:"Sprint reviewed by Mentor",description:"An explicit persisted change",
      goal:null,definitionOfDone:null,startDate:null,endDate:null,dueDate:null,
      expectedUpdatedAt:original,
    });
    expect(edited).toMatchObject({
      id:sprint.id,projectId:project.id,
      title:"Sprint reviewed by Mentor",description:"An explicit persisted change",
      status:"PLANNED",releaseId:sprint.releaseId,
    });
    expect(edited.updatedAt.getTime()).toBeGreaterThan(sprint.updatedAt.getTime());
    const selected=await getMentorSprintProgress(mentor,{
      projectId:project.id,order:"ACTIVE_FIRST",
    });
    expect(selected.items.map(item=>item.id)).toContain(sprint.id);
    await expect(getMentorSprintProgress(mentor,{projectId:randomUUID()}))
      .rejects.toBeDefined();
    const noBlocked=await getMentorSprintProgress(mentor,{
      projectId:project.id,taskAttention:"BLOCKED",
    });
    expect(noBlocked.items).toHaveLength(0);
    await pool.query("update project_tasks set status='BLOCKED' where project_id=$1::uuid",[project.id]);
    const blocked=await getMentorSprintProgress(mentor,{
      projectId:project.id,taskAttention:"BLOCKED",
    });
    expect(blocked.items.map(item=>item.id)).toContain(sprint.id);
    const after=await getProjectInstanceWorkspace(mentor,project.id);
    expect(after.sprints).toEqual(expect.arrayContaining([
      expect.objectContaining({id:sprint.id,title:"Sprint reviewed by Mentor"}),
    ]));
    const audited=await pool.query<{
      event_type:string;actor_user_id:string;college_id:string;
      metadata:Record<string,unknown>;
    }>(`select event_type,actor_user_id,college_id,metadata from activity_events
      where event_type='projects.sprint.updated' and metadata->>'sprintId'=$1`,[sprint.id]);
    expect(audited.rows).toHaveLength(1);
    expect(audited.rows[0]).toMatchObject({
      actor_user_id:SEED_IDS.facultyUser,college_id:SEED_IDS.collegeA,
      metadata:{projectId:project.id,sprintId:sprint.id,changedFields:["title","description"]},
    });
    expect(audited.rows[0]?.metadata).not.toHaveProperty("feedback");

    const next={title:"Malicious overwrite",description:null,
      goal:null,definitionOfDone:null,startDate:null,endDate:null,dueDate:null,
      expectedUpdatedAt:edited.updatedAt.toISOString()};
    const forged:RequestContext={
      ...learner,membership:{...learner.membership!,roles:["MENTOR"]},
    };
    await expect(updateMentorSprintDetails(forged,params,next))
      .rejects.toBeDefined();
    const foreign:RequestContext={
      ...mentor,membership:{...mentor.membership!,collegeId:SEED_IDS.collegeB,
        id:SEED_IDS.facultyCollegeBMembership,roles:["MENTOR"]},
    };
    await expect(updateMentorSprintDetails(foreign,params,next))
      .rejects.toBeDefined();
    await expect(updateMentorSprintDetails(mentor,params,{
      ...next,expectedUpdatedAt:original,
    })).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
    await expect(updateMentorSprintDetails(mentor,params,{
      ...next,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();

    const unchanged=await getProjectInstanceWorkspace(mentor,project.id);
    expect(unchanged.sprints.find(row=>row.id===sprint.id)?.title)
      .toBe("Sprint reviewed by Mentor");
    const [events]=await Promise.all([
      pool.query<{total:string}>(`select count(*)::text as total from activity_events
        where event_type='projects.sprint.updated' and metadata->>'sprintId'=$1`,[sprint.id]),
    ]);
    expect(events.rows[0]?.total).toBe("1");
  });
  it("filters real persisted empty/TODO/DONE Sprint evidence inside exact active Mentor scope",async()=>{
    const {project,sprint}=await fixture();
    const onlyTodo=await getMentorSprintProgress(mentor,{
      projectId:project.id,taskAttention:"TODO",
    });
    expect(onlyTodo.items.map(item=>item.id)).toContain(sprint.id);
    const initiallyEmpty=await getMentorSprintProgress(mentor,{
      projectId:project.id,taskAttention:"NO_TASKS",
    });
    expect(initiallyEmpty.items).toHaveLength(0);
    await pool.query("update project_tasks set status='DONE' where project_id=$1::uuid",[project.id]);
    const completed=await getMentorSprintProgress(mentor,{
      projectId:project.id,taskAttention:"DONE",
    });
    expect(completed.items.map(item=>item.id)).toContain(sprint.id);
    expect((await getMentorSprintProgress(mentor,{
      projectId:project.id,taskAttention:"TODO",
    })).items).toHaveLength(0);
    await pool.query("delete from project_tasks where project_id=$1::uuid",[project.id]);
    const noTasks=await getMentorSprintProgress(mentor,{
      projectId:project.id,taskAttention:"NO_TASKS",
    });
    expect(noTasks.items.map(item=>item.id)).toContain(sprint.id);
    expect(noTasks.items.find(item=>item.id===sprint.id)?.tasks.completionPercent)
      .toBeNull();
    await expect(getMentorSprintProgress(learner,{
      projectId:project.id,taskAttention:"NO_TASKS",
    })).rejects.toBeDefined();
    await expect(getMentorSprintProgress(mentor,{
      projectId:randomUUID(),taskAttention:"NO_TASKS",
    })).rejects.toBeDefined();
  });
  it("rejects task, sprint and release creation after a project is soft-deleted",async()=>{
    const {project,sprint}=await fixture();
    const totals=()=>pool.query<{sprints:number;tasks:number;releases:number}>(`
      select
       (select count(*)::int from project_sprints where project_id=$1) as sprints,
       (select count(*)::int from project_tasks where project_id=$1) as tasks,
       (select count(*)::int from project_releases where project_id=$1) as releases
    `,[project.id]);
    const before=(await totals()).rows[0];
    await pool.query("update project_instances set deleted_at=now() where id=$1",[project.id]);
    try {
      await expect(createMentorProjectTask(mentor,{projectId:project.id},{
        sprintId:sprint.id,title:"Deleted project task",description:null,
        acceptanceCriteria:"Never materialized",priority:"MEDIUM",
        expectedSprintUpdatedAt:sprint.updatedAt.toISOString(),
      })).rejects.toBeDefined();
      await expect(createMentorProjectSprint(mentor,{projectId:project.id},{
        releaseId:sprint.releaseId,title:"Deleted project sprint",
        description:null,goal:null,definitionOfDone:null,
        startDate:null,endDate:null,dueDate:null,
      })).rejects.toBeDefined();
      await expect(writeMentorProjectRelease(mentor,project.id,null,"POST",{
        title:"Deleted project release",
      })).rejects.toBeDefined();
      expect((await totals()).rows[0]).toEqual(before);
    } finally {
      await pool.query("update project_instances set deleted_at=null where id=$1",[project.id]);
    }
  });

  it("creates a registered planned sprint, audits three token-checked transitions and denies scope forgery",async()=>{
    const {project,sprint:original}=await fixture();
    const params={projectId:project.id};
    const created=await createMentorProjectSprint(mentor,params,{
      releaseId:original.releaseId,title:"Mentor Created Sprint",
      description:"Source-backed sprint",
      goal:null,definitionOfDone:null,startDate:null,endDate:null,dueDate:null,
    });
    expect(created).toMatchObject({
      projectId:project.id,releaseId:original.releaseId,
      title:"Mentor Created Sprint",status:"PLANNED",
      sequence:original.sequence+1,
    });
    const byMentor=await getProjectInstanceWorkspace(mentor,project.id);
    expect(byMentor.sprints.some(row=>row.id===created.id)).toBe(true);
    const sprintParams={projectId:project.id,sprintId:created.id};
    await expect(createMentorProjectSprint(mentor,params,{
      releaseId:original.releaseId,title:"Backwards dated sprint",
      description:null,goal:null,definitionOfDone:null,dueDate:null,
      startDate:"2026-10-15",endDate:"2026-10-14",
    })).rejects.toBeDefined();
    const forged:RequestContext={
      ...learner,membership:{...learner.membership!,roles:["MENTOR"]},
    };
    await expect(createMentorProjectSprint(forged,params,{
      releaseId:original.releaseId,title:"Forged sprint",description:null,
      goal:null,definitionOfDone:null,startDate:null,endDate:null,dueDate:null,
    })).rejects.toBeDefined();
    const foreign:RequestContext={
      ...mentor,membership:{...mentor.membership!,collegeId:SEED_IDS.collegeB,
        id:SEED_IDS.facultyCollegeBMembership,roles:["MENTOR"]},
    };
    await expect(createMentorProjectSprint(foreign,params,{
      releaseId:original.releaseId,title:"Foreign sprint",description:null,
      goal:null,definitionOfDone:null,startDate:null,endDate:null,dueDate:null,
    })).rejects.toBeDefined();

    const started=await transitionMentorProjectSprint(mentor,sprintParams,{
      action:"START",expectedUpdatedAt:created.updatedAt.toISOString(),
    });
    expect(started.status).toBe("ACTIVE");
    await expect(transitionMentorProjectSprint(mentor,sprintParams,{
      action:"COMPLETE",expectedUpdatedAt:created.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
    await expect(transitionMentorProjectSprint(forged,sprintParams,{
      action:"COMPLETE",expectedUpdatedAt:started.updatedAt.toISOString(),
    })).rejects.toBeDefined();
    const complete=await transitionMentorProjectSprint(mentor,sprintParams,{
      action:"COMPLETE",expectedUpdatedAt:started.updatedAt.toISOString(),
    });
    expect(complete.status).toBe("COMPLETED");
    const reopened=await transitionMentorProjectSprint(mentor,sprintParams,{
      action:"REOPEN",expectedUpdatedAt:complete.updatedAt.toISOString(),
    });
    expect(reopened.status).toBe("ACTIVE");
    await expect(transitionMentorProjectSprint(mentor,sprintParams,{
      action:"COMPLETE",expectedUpdatedAt:complete.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
    const audit=await pool.query<{
      event_type:string;actor_user_id:string;college_id:string;
      metadata:Record<string,unknown>;
    }>(`select event_type,actor_user_id,college_id,metadata from activity_events
      where metadata->>'sprintId'=$1 and event_type='projects.sprint.updated'`,[created.id]);
    expect(audit.rows).toHaveLength(4);
    expect(audit.rows.map(row=>row.metadata.action).sort()).toEqual(
      ["COMPLETE","CREATE","REOPEN","START"],
    );
    for(const row of audit.rows) {
      expect(row.actor_user_id).toBe(SEED_IDS.facultyUser);
      expect(row.college_id).toBe(SEED_IDS.collegeA);
      expect(row.metadata).not.toHaveProperty("description");
    }
  });
});
