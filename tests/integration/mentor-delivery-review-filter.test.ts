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
import {getMentorDeliveryReviewOverview} from "@/modules/projects/mentor-review-overview-service";
import {getMentorReviewHistory} from "@/modules/projects/mentor-review-history-service";
import {mentorDeliveryReviewCsv} from "@/modules/projects/mentor-review-overview-model";
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
    // DB070 history is append-only; DB071 header pointers reference it. Never
    // disable triggers or delete permanent revision rows from a test teardown.
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
describe("Mentor final delivery age and Project lifecycle filters — PostgreSQL",()=>{
 it("applies persisted project state and older-than-30-day review cutoff before pagination",async()=>{
  const {project}=await fixture();
  const submissionId=randomUUID(), reviewId=randomUUID();
  await pool.query(`insert into project_submissions
    (id,project_id,version,status,summary,created_by_membership_id,
     submitted_by_membership_id,submitted_at)
    values ($1,$2,1,'APPROVED','Age fixture',$3,$3,now())`,[
    submissionId,project.id,SEED_IDS.learnerCollegeAMembership,
  ]);
  await pool.query(`insert into project_submission_reviews
    (id,project_id,submission_id,decision,feedback,
     reviewed_by_user_id,reviewed_by_membership_id,reviewed_at)
    values ($1,$2,$3,'APPROVED','Recorded decision',$4,$5,now()-interval '45 days')`,[
    reviewId,project.id,submissionId,SEED_IDS.facultyUser,
    SEED_IDS.facultyCollegeAMembership,
  ]);
  const historic=await getMentorReviewHistory(mentor,{
    projectId:project.id,projectState:project.status,window:"OLDER_THAN_30_DAYS",
  });
  expect(historic.items.map(item=>item.id)).toContain(reviewId);
  expect((await getMentorReviewHistory(mentor,{
    projectId:project.id,window:"LAST_30_DAYS",
  })).items).toHaveLength(0);
  expect((await getMentorReviewHistory(mentor,{
    projectId:project.id,projectState:"ARCHIVED",
  })).items).toHaveLength(0);
  await expect(getMentorReviewHistory(learner,{
    projectId:project.id,window:"OLDER_THAN_30_DAYS",
  })).rejects.toBeDefined();
  await expect(getMentorReviewHistory(mentor,{
    projectId:randomUUID(),window:"OLDER_THAN_30_DAYS",
  })).rejects.toBeDefined();
 });
});
describe("Mentor final delivery feedback-filtered review history — PostgreSQL",()=>{
 it("filters only registered decisions and feedback with role and tenant denial",async()=>{
  const {project}=await fixture();
  const reviewedId=randomUUID(),draftId=randomUUID(),decisionId=randomUUID();
  await pool.query(`insert into project_submissions
    (id,project_id,version,status,summary,created_by_membership_id,
     submitted_by_membership_id,submitted_at)
    values ($1,$2,1,'CHANGES_REQUESTED','Submitted evidence',$3,$3,now()),
           ($4,$2,2,'DRAFT','Draft later version',$3,null,null)`,[
    reviewedId,project.id,SEED_IDS.learnerCollegeAMembership,draftId,
  ]);
  await pool.query(`insert into project_submission_reviews
    (id,project_id,submission_id,decision,feedback,
     reviewed_by_user_id,reviewed_by_membership_id)
    values ($1,$2,$3,'CHANGES_REQUESTED','Please revise',$4,$5)`,[
    decisionId,project.id,reviewedId,
    SEED_IDS.facultyUser,SEED_IDS.facultyCollegeAMembership,
  ]);
  const query={projectId:project.id,page:1,status:"CHANGES_REQUESTED" as const,
    feedback:"WITH" as const};
  const withFeedback=await getMentorDeliveryReviewOverview(mentor,query);
  expect(withFeedback.total).toBe(1);
  expect(withFeedback.items).toEqual([expect.objectContaining({
    id:reviewedId,feedbackPresent:true,decision:"CHANGES_REQUESTED",
  })]);
  const history=await getMentorReviewHistory(mentor,{search:"Export project",decision:"CHANGES_REQUESTED"});
  expect(history.items.some(item=>item.projectId===project.id)).toBe(true);
  const selected=await getMentorReviewHistory(mentor,{
    projectId:project.id,version:1,order:"OLDEST",window:"LAST_30_DAYS",
  });
  expect(selected.items).toEqual([expect.objectContaining({
    projectId:project.id,version:1,decision:"CHANGES_REQUESTED",
  })]);
  const missingVersion=await getMentorReviewHistory(mentor,{
    projectId:project.id,version:2,
  });
  expect(missingVersion.total).toBe(0);
  await expect(getMentorReviewHistory(mentor,{projectId:randomUUID()}))
    .rejects.toBeDefined();
  const missing=await getMentorReviewHistory(mentor,{search:"%no-project-match",decision:"ALL"});
  expect(missing.items.some(item=>item.projectId===project.id)).toBe(false);
  await expect(getMentorReviewHistory(learner,{search:"Export project"})).rejects.toBeDefined();
  const csv=mentorDeliveryReviewCsv(withFeedback.items,0);
  expect(csv).toContain("Changes requested");
  expect(csv).not.toContain("Please revise");
  expect(csv).not.toContain("learner");
  const drafts=await getMentorDeliveryReviewOverview(mentor,{
    ...query,status:"DRAFT",feedback:"WITHOUT",
  });
  expect(drafts.items).toEqual([expect.objectContaining({
    id:draftId,status:"DRAFT",feedbackPresent:false,
  })]);
  await expect(getMentorDeliveryReviewOverview(learner,query)).rejects.toBeDefined();
  const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
    id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(getMentorDeliveryReviewOverview(foreign,query)).rejects.toBeDefined();
  const disabled:RequestContext={...mentor,user:{...mentor.user,platformStatus:"DISABLED"}};
  await expect(getMentorDeliveryReviewOverview(disabled,query)).rejects.toBeDefined();
  await expect(getMentorDeliveryReviewOverview(mentor,{
    ...query,collegeId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
 });
});
