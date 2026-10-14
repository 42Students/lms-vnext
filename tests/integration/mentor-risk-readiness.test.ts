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
import {getMentorRiskReadiness} from "@/modules/projects/mentor-risk-readiness-service";
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
  const template=await createProjectTemplate(root,{slug:"chat11-risk-t-"+suffix,
    title:"Risk readiness fixture "+suffix,blueprint:{
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
    templateId:template.template.id,slug:"chat11-risk-p-"+suffix,title:"Risk project "+suffix});
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.facultyCollegeAMembership,
    role:"MENTOR",isPrimary:true});
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.learnerCollegeAMembership,
    role:"LEARNER"});
  const view=await getProjectInstanceWorkspace(mentor,project.id);
  return {project,task:view.tasks[0]!};
}
describe("Mentor exact-project risk and readiness drill-ins — PostgreSQL",()=>{
  it("uses registered status evidence with role, tenant and strict-query denial",async()=>{
    const {project,task}=await fixture();
    await pool.query("update project_tasks set status='BLOCKED' where id=$1",[task.id]);
    const meetingId=randomUUID();
    await pool.query(`insert into project_meetings
      (id,project_id,status,meeting_type,title,starts_at,ends_at,time_zone,
       requested_by_membership_id,created_by_user_id)
      values ($1,$2,'REQUESTED','GENERAL',$3,
       '2026-11-01T08:00:00Z','2026-11-01T09:00:00Z','Asia/Kolkata',$4,$5)`,[
      meetingId,project.id,"Requested checkpoint",
      SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser,
    ]);
    const scheduledId=randomUUID();
    await pool.query(`insert into project_meetings
      (id,project_id,status,meeting_type,title,starts_at,ends_at,time_zone,
       requested_by_membership_id,created_by_user_id,scheduled_by_user_id,
       scheduled_by_membership_id,meeting_url)
      values ($1,$2,'SCHEDULED','GENERAL','Past unclosed checkpoint',
       '2026-09-01T08:00:00Z','2026-09-01T09:00:00Z','Asia/Kolkata',
       $3,$4,$5,$6,'https://meet.example.org/checkpoint')`,[
      scheduledId,project.id,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser,
      SEED_IDS.facultyUser,SEED_IDS.facultyCollegeAMembership,
    ]);
    const query={projectId:project.id,focus:"ALL" as const,page:1};
    const view=await getMentorRiskReadiness(mentor,query);
    expect(view).toMatchObject({
      enabled:true,projectTitle:project.title,
      counts:{blockedTasks:1,pendingMeetings:1,scheduledPastDay:1,totalTasks:2},
    });
    expect(view.items).toEqual(expect.arrayContaining([
      expect.objectContaining({key:"blocked:"+task.id,category:"RISK"}),
      expect.objectContaining({key:"meeting:"+meetingId,category:"RISK"}),
      expect.objectContaining({key:"scheduled-past:"+scheduledId,category:"RISK"}),
      expect.objectContaining({key:"delivery",category:"READINESS"}),
    ]));
    const highPriority=await getMentorRiskReadiness(mentor,{
      ...query,taskPriority:"HIGH",
    });
    expect(highPriority.items.some(row=>row.key==="blocked:"+task.id)).toBe(true);
    const lowPriority=await getMentorRiskReadiness(mentor,{
      ...query,taskPriority:"LOW",
    });
    expect(lowPriority.items.some(row=>row.key==="blocked:"+task.id)).toBe(false);
    const risk=await getMentorRiskReadiness(mentor,{...query,focus:"RISK"});
    expect(risk.items.every(row=>row.category==="RISK")).toBe(true);
    await expect(getMentorRiskReadiness(learner,query)).rejects.toBeDefined();
    const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
      id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
    await expect(getMentorRiskReadiness(foreign,query)).rejects.toBeDefined();
    await expect(getMentorRiskReadiness(mentor,{...query,collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    await expect(getMentorRiskReadiness(mentor,{
      ...query,projectId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
