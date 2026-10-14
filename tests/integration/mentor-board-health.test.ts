import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege}
  from "@/modules/projects/template-service";
import {createProjectInstance} from "@/modules/projects/instance-service";
import {addProjectMember} from "@/modules/projects/member-service";
import {getMentorBoardReview} from "@/modules/projects/mentor-board-review-service";

if(!process.env.TEST_DATABASE_URL)throw new Error("Requires isolated disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const root:RequestContext={
  user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",
    platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null,
};
const scopedRoot:RequestContext={...root,adminScope:{
  organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
}};
const admin:RequestContext={
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const created:{projectIds:string[];templateIds:string[];members:string[];users:string[]}={
  projectIds:[],templateIds:[],members:[],users:[],
};
async function cleanup(){
  if(created.projectIds.length){
    for(const table of ["project_task_submissions","project_submission_reviews",
      "project_submissions","project_meetings","project_members","project_resources",
      "project_tasks","project_sprints","project_releases"]){
      await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[created.projectIds]);
    }
    await pool.query("delete from project_instances where id=any($1::uuid[])",[created.projectIds]);
    created.projectIds=[];
  }
  if(created.templateIds.length){
    await pool.query("delete from project_template_college_assignments where template_id=any($1::uuid[])",[created.templateIds]);
    await pool.query("delete from project_template_versions where template_id=any($1::uuid[])",[created.templateIds]);
    await pool.query("delete from project_templates where id=any($1::uuid[])",[created.templateIds]);
    created.templateIds=[];
  }
  if(created.members.length){
    await pool.query("delete from membership_roles where membership_id=any($1::uuid[])",[created.members]);
    await pool.query("delete from college_memberships where id=any($1::uuid[])",[created.members]);
    created.members=[];
  }
  if(created.users.length){
    await pool.query("delete from users where id=any($1::uuid[])",[created.users]);
    created.users=[];
  }
  // Never delete immutable activity_events or their published history.
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});

async function newMentor(collegeId:string,slug:string):Promise<RequestContext>{
  const userId=randomUUID(),membershipId=randomUUID(),roleId=randomUUID();
  await pool.query(`insert into users(id,identity_uid,email,display_name,platform_status)
    values($1,$2,$3,$4,'ACTIVE')`,[
    userId,"c4board-"+slug,"c4board-"+slug+"@example.invalid","Mentor "+slug]);
  created.users.push(userId);
  await pool.query("insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [membershipId,userId,collegeId]);
  created.members.push(membershipId);
  await pool.query("insert into membership_roles(id,membership_id,role) values($1,$2,'MENTOR')",
    [roleId,membershipId]);
  return {user:{id:userId,identityUid:"c4board-"+slug,platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:membershipId,collegeId,organizationId:SEED_IDS.organization,
      status:"ACTIVE",roles:["MENTOR"]}};
}
async function fixture(){
  const suffix=randomUUID().replaceAll("-","").slice(0,14);
  const mentor=await newMentor(SEED_IDS.collegeA,suffix+"a");
  const foreign=await newMentor(SEED_IDS.collegeB,suffix+"b");
  const templ=await createProjectTemplate(root,{
    slug:"chat4-board-t-"+suffix,title:"Board template "+suffix,
    blueprint:{overview:{goal:"Review actual board",deliverables:["Board"]},
      releases:[{key:"release-a",title:"Release",sequence:0}],
      sprints:[{key:"sprint-a",releaseKey:"release-a",title:"Sprint",sequence:0}],
      tasks:[{key:"task-a",sprintKey:"sprint-a",title:"Draft board task",
        priority:"HIGH" as const,sequence:0}],resources:[]},
  });
  created.templateIds.push(templ.template.id);
  await publishProjectTemplate(root,templ.template.id);
  await assignProjectTemplateToCollege(scopedRoot,templ.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{
    collegeId:SEED_IDS.collegeA,templateId:templ.template.id,
    slug:"chat4-board-p-"+suffix,title:"Board project "+suffix,
  });
  created.projectIds.push(project.id);
  await addProjectMember(admin,project.id,{
    membershipId:mentor.membership!.id,role:"MENTOR",isPrimary:true,
  });
  return {project,mentor,foreign};
}

describe("Mentor task board positive/scope PostgreSQL",()=>{
  it("reads only registered own-project task statuses; denies wrong-role, foreign, forged",async()=>{
    const {project,mentor,foreign}=await fixture();
    const data=await getMentorBoardReview(mentor,{projectId:project.id});
    expect(data).toMatchObject({enabled:true,count:1,total:1,
      totals:{TODO:1,IN_REVIEW:0,DONE:0},completedPercent:0});
    expect(data.items).toEqual([expect.objectContaining({
      title:"Draft board task",priority:"HIGH",status:"TODO",sprintTitle:"Sprint",
    })]);
    const noMatch=await getMentorBoardReview(mentor,{
      projectId:project.id,status:"DONE",page:1,
    });
    expect(noMatch).toMatchObject({count:1,total:0,items:[]});
    await expect(getMentorBoardReview({
      ...mentor,membership:{...mentor.membership!,roles:["LEARNER"]},
    },{projectId:project.id})).rejects.toBeDefined();
    await expect(getMentorBoardReview(foreign,{projectId:project.id}))
      .rejects.toBeDefined();
    await expect(getMentorBoardReview(mentor,{projectId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    await expect(getMentorBoardReview(mentor,{
      projectId:project.id,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
