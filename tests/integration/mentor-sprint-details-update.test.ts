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
  if(projectIds.length) {
    // Remove only events and project rows created by this test invocation.
    await pool.query(`delete from in_app_notifications where event_id in
      (select id from activity_events where subject_id = any($1::text[])
      or metadata ->> 'projectId' = any($1::text[]))`,[projectIds]);
    await pool.query(`delete from activity_events where subject_id = any($1::text[])
      or metadata ->> 'projectId' = any($1::text[])`,[projectIds]);
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
  const templateIds=[...tracked.templateIds];
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
    const {project,sprint}=await fixture();
    const original=sprint.updatedAt.toISOString();
    const params={projectId:project.id,sprintId:sprint.id};
    const edited=await updateMentorSprintDetails(mentor,params,{
      title:"Sprint reviewed by Mentor",description:"An explicit persisted change",
      expectedUpdatedAt:original,
    });
    expect(edited).toMatchObject({
      id:sprint.id,projectId:project.id,
      title:"Sprint reviewed by Mentor",description:"An explicit persisted change",
      status:"PLANNED",releaseId:sprint.releaseId,
    });
    expect(edited.updatedAt.getTime()).toBeGreaterThan(sprint.updatedAt.getTime());
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
});
