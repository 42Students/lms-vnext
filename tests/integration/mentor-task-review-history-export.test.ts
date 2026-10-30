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
import {getMentorTaskReviewHistory} from "@/modules/projects/mentor-task-history-service";
import {mentorReviewedTasksCsv} from "@/modules/projects/mentor-task-review-export-model";
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
    for(const table of ["project_template_college_assignments"])
      await pool.query("delete from "+table+" where template_id=any($1::uuid[])",[tracked.templates]);
    // DB070 history is append-only; the DB071 header FK keeps this template
    // referenced. Retain unique fixture history instead of bypassing guards.
    const retention=await pool.query<{retainHistory:boolean}>(
      "select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"",
    );
    if(!retention.rows[0]?.retainHistory){
      await pool.query("delete from project_template_versions where template_id=any($1::uuid[])",[tracked.templates]);
      await pool.query("delete from project_templates where id=any($1::uuid[])",[tracked.templates]);
    }
  }
  tracked.projects=[];tracked.templates=[];
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});
async function fixture(){
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const template=await createProjectTemplate(root,{slug:"chat11-history-export-t-"+suffix,
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
    templateId:template.template.id,slug:"chat11-history-export-p-"+suffix,title:"Export project "+suffix});
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.facultyCollegeAMembership,
    role:"MENTOR",isPrimary:true});
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.learnerCollegeAMembership,
    role:"LEARNER"});
  const view=await getProjectInstanceWorkspace(mentor,project.id);
  return {project,sprint:view.sprints[0]!};
}
describe("Mentor reviewed task history CSV — disposable PostgreSQL",()=>{
  it("exports a real reviewed task version and non-leaking scope denial",async()=>{
    const {project}=await fixture();
    const tasks=await pool.query<{id:string}>(
      "select id from project_tasks where project_id=$1 order by sequence limit 1",[project.id]);
    const taskId=tasks.rows[0]?.id;
    if(!taskId)throw new Error("Fixture task missing");
    const submissionId=randomUUID();
    await pool.query(`insert into project_task_submissions
      (id,project_id,task_id,version,submitted_by_membership_id,submission_url,
       status,reviewed_by_user_id,reviewed_by_membership_id,reviewed_at)
      values ($1,$2,$3,1,$4,'https://example.org/review','APPROVED',$5,$6,now())`,[
        submissionId,project.id,taskId,SEED_IDS.learnerCollegeAMembership,
        SEED_IDS.facultyUser,SEED_IDS.facultyCollegeAMembership,
      ]);
    const query={decision:"APPROVED" as const,search:"",page:1};
    const data=await getMentorTaskReviewHistory(mentor,query);
    expect(data.enabled).toBe(true);
    expect((await getMentorTaskReviewHistory(mentor,{...query,priority:"HIGH"})).items
      .some(row=>row.id===submissionId)).toBe(true);
    expect((await getMentorTaskReviewHistory(mentor,{...query,priority:"LOW"})).items
      .some(row=>row.id===submissionId)).toBe(false);
    expect(data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({id:submissionId,projectId:project.id,status:"APPROVED"}),
    ]));
    const csv=mentorReviewedTasksCsv(data.items,0);
    expect(csv).toContain("Approved");
    expect(csv).toContain("IST");
    expect(csv).not.toContain("submitted_by_membership_id");
    expect(csv).not.toContain("submission_url");
    expect(csv).not.toContain("reviewed_by_user_id");
    const rejected=await getMentorTaskReviewHistory(mentor,{
      ...query,decision:"CHANGES_REQUESTED",
    });
    expect(rejected.items.some(row=>row.id===submissionId)).toBe(false);
    await expect(getMentorTaskReviewHistory(learner,query)).rejects.toBeDefined();
    const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
      id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
    const foreignData=await getMentorTaskReviewHistory(foreign,query);
    expect(foreignData.items.some(row=>row.id===submissionId)).toBe(false);
    const disabled:RequestContext={...mentor,user:{...mentor.user,platformStatus:"DISABLED"}};
    await expect(getMentorTaskReviewHistory(disabled,query)).rejects.toBeDefined();
    await expect(getMentorTaskReviewHistory(mentor,{
      ...query,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
