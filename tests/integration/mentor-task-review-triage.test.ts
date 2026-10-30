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
import {getMentorTaskReviews} from "@/modules/projects/mentor-task-review-service";
import {mentorPendingTaskReviewCsv} from "@/modules/projects/mentor-pending-task-review-export";
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
    // DB070/071: historical revisions and parent pointers are permanent;
    // preserving unique disposable fixtures is safer than disabling triggers.
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
  const template=await createProjectTemplate(root,{slug:"chat11-review-filter-t-"+suffix,
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
    templateId:template.template.id,slug:"chat11-review-filter-p-"+suffix,title:"Export project "+suffix});
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.facultyCollegeAMembership,
    role:"MENTOR",isPrimary:true});
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.learnerCollegeAMembership,
    role:"LEARNER"});
  const view=await getProjectInstanceWorkspace(mentor,project.id);
  return {project,sprint:view.sprints[0]!};
}
describe("Mentor pending task review triage PostgreSQL",()=>{
  it("filters registered pending tasks by priority and order, denying foreign actors",async()=>{
    const {project}=await fixture();
    const rows=await pool.query<{id:string;priority:string}>(`
      select id,priority from project_tasks where project_id=$1 order by priority`,[project.id]);
    expect(rows.rows).toHaveLength(2);
    await pool.query("update project_instances set status='ACTIVE' where id=$1",[project.id]);
    for(const task of rows.rows){
      await pool.query("update project_tasks set status='IN_REVIEW' where id=$1",[task.id]);
      const submittedAt=task.priority==="HIGH"?
        "2026-10-10T08:00:00Z":"2026-10-11T08:00:00Z";
      await pool.query(`insert into project_task_submissions
        (project_id,task_id,version,submitted_by_membership_id,submission_url,submitted_at)
        values ($1,$2,1,$3,'https://example.org/project-task',$4::timestamptz)`,[
        project.id,task.id,SEED_IDS.learnerCollegeAMembership,submittedAt,
      ]);
    }
    const query={search:"",page:1,pageSize:20,priority:"HIGH" as const,order:"OLDEST" as const};
    const high=await getMentorTaskReviews(mentor,query);
    expect(high.enabled).toBe(true);
    expect(high.total).toBe(1);
    expect(high.items[0]?.priority).toBe("HIGH");
    const exact=await getMentorTaskReviews(mentor,{...query,projectId:project.id,assignment:"PRIMARY"});
    expect(exact.total).toBe(1);
    const supporting=await getMentorTaskReviews(mentor,{...query,assignment:"SUPPORTING"});
    expect(supporting.total).toBe(0);
    await expect(getMentorTaskReviews(mentor,{...query,projectId:randomUUID()})).rejects.toBeDefined();
    const csv=mentorPendingTaskReviewCsv(high.items,0);
    expect(csv).toContain("IST");
    expect(csv).not.toContain("submission_url");
    const all=await getMentorTaskReviews(mentor,{...query,priority:"ALL"});
    expect(all.total).toBe(2);
    expect(all.items.map(row=>row.priority)).toEqual(["HIGH","LOW"]);
    const newest=await getMentorTaskReviews(mentor,{...query,priority:"ALL",order:"NEWEST"});
    expect(newest.items.map(row=>row.priority)).toEqual(["LOW","HIGH"]);
    const priorityFirst=await getMentorTaskReviews(mentor,{...query,priority:"ALL",order:"PRIORITY"});
    expect(priorityFirst.items.map(row=>row.priority)).toEqual(["HIGH","LOW"]);
    const versionOne=await getMentorTaskReviews(mentor,{...query,priority:"ALL",version:1});
    expect(versionOne.total).toBe(2);
    const absentVersion=await getMentorTaskReviews(mentor,{...query,priority:"ALL",version:2});
    expect(absentVersion.total).toBe(0);
    await expect(getMentorTaskReviews(learner,{...query,version:1})).rejects.toBeDefined();
    await expect(getMentorTaskReviews(learner,query)).rejects.toBeDefined();
    const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
      id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
    const foreignRows=await getMentorTaskReviews(foreign,query);
    expect(foreignRows.items.some(row=>row.projectId===project.id)).toBe(false);
    await expect(getMentorTaskReviews(mentor,{...query,collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    const disabled:RequestContext={...mentor,user:{...mentor.user,platformStatus:"DISABLED"}};
    await expect(getMentorTaskReviews(disabled,query)).rejects.toBeDefined();
  },30_000);
});
