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
import { updateMentorTaskDetails } from "@/modules/projects/mentor-task-details-service";

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
    // Retain the immutable DB070 revision rows and DB071-referenced template
    // headers when the respective migration is present. Never disable guards.
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
      await pool.query("delete from project_template_college_assignments where template_id = any($1::uuid[])",[templateIds]);
      await pool.query("delete from project_template_versions where template_id = any($1::uuid[])",[templateIds]);
      await pool.query("delete from project_templates where id = any($1::uuid[])",[templateIds]);
    }
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
    slug:"chat4-taskedit-t-"+suffix,title:"Isolated Sprint Edit "+suffix,blueprint:blueprint(),
  });
  tracked.templateIds.push(created.template.id);
  await publishProjectTemplate(root,created.template.id);
  await assignProjectTemplateToCollege(scopedRoot,created.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{
    collegeId:SEED_IDS.collegeA,templateId:created.template.id,
    slug:"chat4-taskedit-p-"+suffix,title:"Isolated Project "+suffix,
  });
  tracked.projectIds.push(project.id);
  await addProjectMember(admin,project.id,{
    membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
  });
  await addProjectMember(admin,project.id,{
    membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",isPrimary:true,
  });
  const workspace=await getProjectInstanceWorkspace(mentor,project.id);
  return {project,task:workspace.tasks[0]!};
}


describe("Mentor task details PATCH: fresh PostgreSQL success, audit and denial",()=>{
  it("refuses edits to a deleted task, deleted sprint, or deleted project",async()=>{
    const {project,task}=await fixture();
    const input={
      title:"Must never overwrite history",description:"Forbidden after deletion",
      acceptanceCriteria:"Not editable",priority:"HIGH",
      expectedUpdatedAt:task.updatedAt.toISOString(),
    };
    const params={projectId:project.id,taskId:task.id};
    await pool.query("UPDATE project_tasks SET deleted_at=now() WHERE id=$1",[task.id]);
    try {
      await expect(updateMentorTaskDetails(mentor,params,input))
        .rejects.toMatchObject({code:"PROJECT_TASK_NOT_FOUND"});
    } finally {
      await pool.query("UPDATE project_tasks SET deleted_at=null WHERE id=$1",[task.id]);
    }
    if(!task.sprintId)throw new Error("Fixture task requires a sprint");
    await pool.query("UPDATE project_sprints SET deleted_at=now() WHERE id=$1",[task.sprintId]);
    try {
      await expect(updateMentorTaskDetails(mentor,params,input))
        .rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
    } finally {
      await pool.query("UPDATE project_sprints SET deleted_at=null WHERE id=$1",[task.sprintId]);
    }
    await pool.query("UPDATE project_instances SET deleted_at=now() WHERE id=$1",[project.id]);
    try {
      await expect(updateMentorTaskDetails(mentor,params,input)).rejects.toBeDefined();
    } finally {
      await pool.query("UPDATE project_instances SET deleted_at=null WHERE id=$1",[project.id]);
    }
    const stored=await pool.query<{title:string}>(
      "SELECT title FROM project_tasks WHERE id=$1",[task.id],
    );
    expect(stored.rows[0]?.title).toBe(task.title);
  });

  it("updates registered fields exactly once and rejects stale, forged and foreign inputs",async()=>{
    const {project,task:created}=await fixture();
    // Force a fresh-DB microsecond fraction to test JS-millisecond optimistic tokens.
    await pool.query(`update project_tasks
      set updated_at = date_trunc('milliseconds',updated_at) + interval '321 microseconds'
      where id = $1`,[created.id]);
    const before=await getProjectInstanceWorkspace(mentor,project.id);
    const task=before.tasks.find(row=>row.id===created.id);
    expect(task).toBeDefined();
    if(!task) throw new Error("Fixture task is missing");
    const original=task.updatedAt.toISOString();
    const params={projectId:project.id,taskId:task.id};
    const result=await updateMentorTaskDetails(mentor,params,{
      title:"Mentor checked task",description:"Recorded description",
      acceptanceCriteria:"Acceptance is reviewable",priority:"CRITICAL",
      expectedUpdatedAt:original,
    });
    expect(result).toMatchObject({
      id:task.id,projectId:project.id,sprintId:task.sprintId,
      title:"Mentor checked task",description:"Recorded description",
      acceptanceCriteria:"Acceptance is reviewable",priority:"CRITICAL",
      status:"TODO",
    });
    expect(result.updatedAt.getTime()).toBeGreaterThan(task.updatedAt.getTime());
    const workspace=await getProjectInstanceWorkspace(mentor,project.id);
    expect(workspace.tasks).toEqual(expect.arrayContaining([
      expect.objectContaining({id:task.id,title:"Mentor checked task",priority:"CRITICAL"}),
    ]));
    const auditQuery=`select event_type,actor_user_id,college_id,metadata from activity_events
      where event_type='projects.task.details_updated' and metadata->>'taskId'=$1`;
    const audit=await pool.query<{event_type:string;actor_user_id:string;
      college_id:string;metadata:Record<string,unknown>}>(auditQuery,[task.id]);
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0]).toMatchObject({
      actor_user_id:SEED_IDS.facultyUser,college_id:SEED_IDS.collegeA,
      metadata:{
        projectId:project.id,taskId:task.id,
        changedFields:["title","description","acceptanceCriteria","priority"],
      },
    });
    expect(audit.rows[0]?.metadata).not.toHaveProperty("submissionUrl");
    expect(audit.rows[0]?.metadata).not.toHaveProperty("feedback");

    const next={
      title:"Stale attempt",description:null,acceptanceCriteria:null,
      priority:"LOW",expectedUpdatedAt:result.updatedAt.toISOString(),
    };
    const forged:RequestContext={
      ...learner,membership:{...learner.membership!,roles:["MENTOR"]},
    };
    await expect(updateMentorTaskDetails(forged,params,next))
      .rejects.toBeDefined();
    const foreign:RequestContext={
      ...mentor,membership:{...mentor.membership!,
        id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,
        roles:["MENTOR"]},
    };
    await expect(updateMentorTaskDetails(foreign,params,next))
      .rejects.toBeDefined();
    await expect(updateMentorTaskDetails(mentor,params,{
      ...next,expectedUpdatedAt:original,
    })).rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
    await expect(updateMentorTaskDetails(mentor,params,{
      ...next,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(updateMentorTaskDetails(mentor,params,{
      title:result.title,description:result.description,
      acceptanceCriteria:result.acceptanceCriteria,
      priority:result.priority,expectedUpdatedAt:result.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
    await expect(updateMentorTaskDetails(learner,params,next))
      .rejects.toBeDefined();

    const unchanged=await getProjectInstanceWorkspace(mentor,project.id);
    expect(unchanged.tasks.find(row=>row.id===task.id)?.title).toBe("Mentor checked task");
    const events=await pool.query<{total:string}>(`select count(*)::text as total from
      activity_events where event_type='projects.task.details_updated'
      and metadata->>'taskId'=$1`,[task.id]);
    expect(events.rows[0]?.total).toBe("1");
  });
});
