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
import {getMentorDeliveryVersion} from "@/modules/projects/mentor-delivery-version-service";
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
    // DB070 template revisions are immutable and DB071 keeps parent pointers.
    // Retain their unique disposable fixture history instead of bypassing SQL guards.
    const retention = await pool.query<{ retainHistory: boolean }>(
      "select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"",
    );
    if (!retention.rows[0]?.retainHistory) {
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
  const template=await createProjectTemplate(root,{slug:"chat11-delivery-detail-t-"+suffix,
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
    templateId:template.template.id,slug:"chat11-delivery-detail-p-"+suffix,title:"Export project "+suffix});
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.facultyCollegeAMembership,
    role:"MENTOR",isPrimary:true});
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.learnerCollegeAMembership,
    role:"LEARNER"});
  const view=await getProjectInstanceWorkspace(mentor,project.id);
  return {project,sprint:view.sprints[0]!};
}
describe("Mentor scoped final delivery review text — PostgreSQL",()=>{
  it("reads exactly one stored version and denies wrong-role/foreign-scope access",async()=>{
    const {project}=await fixture();
    const submissionId=randomUUID(),reviewId=randomUUID();
    await pool.query(`insert into project_submissions
      (id,project_id,version,status,summary,created_by_membership_id,
       submitted_by_membership_id,submitted_at)
      values ($1,$2,1,'CHANGES_REQUESTED','Delivery summary',$3,$3,now())`,[
        submissionId,project.id,SEED_IDS.learnerCollegeAMembership,
      ]);
    await pool.query(`insert into project_submission_reviews
      (id,project_id,submission_id,decision,feedback,reviewed_by_user_id,
       reviewed_by_membership_id)
      values ($1,$2,$3,'CHANGES_REQUESTED','Revise evidence',$4,$5)`,[
        reviewId,project.id,submissionId,SEED_IDS.facultyUser,
        SEED_IDS.facultyCollegeAMembership,
      ]);
    const params={projectId:project.id,submissionId};
    const view=await getMentorDeliveryVersion(mentor,params);
    expect(view).toMatchObject({projectId:project.id,version:{
      version:1,status:"CHANGES_REQUESTED",decisionLabel:"Changes requested",
      feedback:"Revise evidence",hasReview:true,
    }});
    expect(JSON.stringify(view)).not.toContain("submitted_by_membership_id");
    expect(JSON.stringify(view)).not.toContain("source_url");
    await expect(getMentorDeliveryVersion(learner,params)).rejects.toBeDefined();
    const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
      id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
    await expect(getMentorDeliveryVersion(foreign,params)).rejects.toBeDefined();
    const disabled:RequestContext={...mentor,user:{...mentor.user,platformStatus:"DISABLED"}};
    await expect(getMentorDeliveryVersion(disabled,params)).rejects.toBeDefined();
    await expect(getMentorDeliveryVersion(mentor,{...params,collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    await expect(getMentorDeliveryVersion(mentor,{
      ...params,submissionId:randomUUID(),
    })).rejects.toMatchObject({code:"PROJECT_SUBMISSION_NOT_FOUND"});
  });
});
