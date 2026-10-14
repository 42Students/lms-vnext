import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege}
  from "@/modules/projects/template-service";
import {createProjectInstance,getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {addProjectMember} from "@/modules/projects/member-service";
import {getMentorResourceDirectory} from "@/modules/projects/mentor-resource-directory-service";
import {mentorResourceDirectoryCsv} from "@/modules/projects/mentor-resource-directory-model";
if(!process.env.TEST_DATABASE_URL)throw new Error("Requires disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const root:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"root",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
const scopedRoot:RequestContext={...root,adminScope:{organizationId:SEED_IDS.organization,
  collegeId:SEED_IDS.collegeA}};
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"admin",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.collegeAdminMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const mentor:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"mentor",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.facultyCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["MENTOR","FACULTY"]}};
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,identityUid:"learner",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.learnerCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["LEARNER"]}};
const tracked:{projects:string[];templates:string[]}={projects:[],templates:[]};
async function cleanup(){
  // Immutable activity events and the identities they reference remain untouched.
  if(tracked.projects.length){
    for(const table of ["project_task_submissions","project_submission_reviews","project_submissions",
      "project_meetings","project_members","project_resources","project_tasks",
      "project_sprints","project_releases"]){
      await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[tracked.projects]);
    }
    await pool.query("delete from project_instances where id=any($1::uuid[])",[tracked.projects]);
  }
  if(tracked.templates.length){
    for(const table of ["project_template_college_assignments","project_template_versions"])
      await pool.query("delete from "+table+" where template_id=any($1::uuid[])",[tracked.templates]);
    await pool.query("delete from project_templates where id=any($1::uuid[])",[tracked.templates]);
  }
  tracked.projects=[];tracked.templates=[];
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});
async function fixture(){
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const template=await createProjectTemplate(root,{slug:"chat11-resource-t-"+suffix,
    title:"Board export fixture "+suffix,blueprint:{
      overview:{goal:"Filter board",deliverables:["Export"]},
      releases:[{key:"r",title:"Release",sequence:0}],
      sprints:[{key:"s",releaseKey:"r",title:"Visible Sprint",sequence:0}],
      tasks:[{key:"high",sprintKey:"s",title:"=Unsafe heading",priority:"HIGH" as const,sequence:0},
        {key:"low",sprintKey:"s",title:"Ordinary task",priority:"LOW" as const,sequence:1}],
      resources:[],
    }});
  tracked.templates.push(template.template.id);
  await publishProjectTemplate(root,template.template.id);
  await assignProjectTemplateToCollege(scopedRoot,template.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{collegeId:SEED_IDS.collegeA,
    templateId:template.template.id,slug:"chat11-resource-p-"+suffix,title:"Export project "+suffix});
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.facultyCollegeAMembership,
    role:"MENTOR",isPrimary:true});
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.learnerCollegeAMembership,
    role:"LEARNER"});
  const view=await getProjectInstanceWorkspace(mentor,project.id);
  return {project,sprint:view.sprints[0]!};
}
describe("Mentor scoped resource metadata and links — PostgreSQL",()=>{
 it("reads only assigned project resource metadata and denies forged/foreign scope",async()=>{
  const {project}=await fixture();
  const firstId=randomUUID(),secondId=randomUUID();
  await pool.query(`insert into project_resources
   (id,project_id,title,description,url,required,sequence,status)
   values ($1,$2,'=Unsafe resource','Registered reference',
    'https://example.org/reference',true,0,'ACTIVE'),
    ($3,$2,'Optional link','No secure link','javascript:alert(1)',false,1,'ACTIVE')`,[
    firstId,project.id,secondId,
  ]);
  const query={projectId:project.id,required:"REQUIRED" as const,
    search:"Unsafe",page:1};
  const result=await getMentorResourceDirectory(mentor,query);
  expect(result).toMatchObject({enabled:true,registered:2,requiredCount:1,
    linkableCount:1,total:1});
  expect(result.items).toEqual([expect.objectContaining({
    id:firstId,title:"=Unsafe resource",safeUrl:"https://example.org/reference",
  })]);
  const csv=mentorResourceDirectoryCsv(result.exportItems,result.exportOmitted);
  expect(csv).toContain("'=Unsafe resource");
  expect(csv).not.toContain("https://example.org/reference");
  expect(csv).not.toContain("javascript");
  await expect(getMentorResourceDirectory(learner,query)).rejects.toBeDefined();
  const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
    id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(getMentorResourceDirectory(foreign,query)).rejects.toBeDefined();
  const disabled:RequestContext={...mentor,user:{...mentor.user,platformStatus:"DISABLED"}};
  await expect(getMentorResourceDirectory(disabled,query)).rejects.toBeDefined();
  await expect(getMentorResourceDirectory(mentor,{...query,collegeId:SEED_IDS.collegeB}))
    .rejects.toBeDefined();
 });
});
