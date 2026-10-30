import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege}
  from "@/modules/projects/template-service";
import {createProjectInstance,getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {addProjectMember,updateProjectMember,endProjectMember,listProjectMembers} from "@/modules/projects/member-service";
import {getMentorResourceDirectory} from "@/modules/projects/mentor-resource-directory-service";
import {createProjectResource,updateProjectResource,archiveProjectResource} from "@/modules/projects/resource-service";
import {getMentorPortfolioActivity} from "@/modules/projects/mentor-portfolio-service";
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
  // Resource history is append-only and its project FK is RESTRICT. Keep the
  // complete audited fixture (including its template) in this disposable test
  // database rather than deleting history or orphaning the audited project.
  let removableProjects=tracked.projects;
  if(tracked.projects.length){
    const audited=await pool.query<{project_id:string}>(`
      select distinct project_id from project_resource_audit
      where project_id=any($1::uuid[])`,[tracked.projects]);
    const preserved=new Set(audited.rows.map(row=>row.project_id));
    removableProjects=tracked.projects.filter(id=>!preserved.has(id));
  }
  if(removableProjects.length){
    for(const table of ["project_task_submissions","project_submission_reviews","project_submissions",
      "project_meeting_history","project_meetings","project_members","project_resources","project_tasks",
      "project_sprints","project_releases"]){
      await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[removableProjects]);
    }
    await pool.query("delete from project_instances where id=any($1::uuid[])",[removableProjects]);
  }
  if(tracked.templates.length){
    // Templates referenced by retained projects must remain as well.
    const orphaned=await pool.query<{id:string}>(`
      select t.id from project_templates t where t.id=any($1::uuid[])
      and not exists (select 1 from project_instances p where p.template_id=t.id)`,
      [tracked.templates]);
    const removableTemplates=orphaned.rows.map(row=>row.id);
    if(removableTemplates.length){
      for(const table of ["project_template_college_assignments"])
        await pool.query("delete from "+table+" where template_id=any($1::uuid[])",[removableTemplates]);
      // DB070 and DB071 require preserving immutable history and parent headers.
      const retention=await pool.query<{retainHistory:boolean}>("select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"");
      if(!retention.rows[0]?.retainHistory){
        await pool.query("delete from project_template_versions where template_id=any($1::uuid[])",[removableTemplates]);
        await pool.query("delete from project_templates where id=any($1::uuid[])",[removableTemplates]);
      }
    }
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
 it("emits real Team add, update and end history without leaking membership contacts",async()=>{
  const {project}=await fixture();
  const existing=await pool.query<{id:string}>(`select id from project_members
    where project_id=$1 and membership_id=$2 and ended_at is null`,[
    project.id,SEED_IDS.learnerCollegeAMembership,
  ]);
  const memberId=existing.rows[0]?.id;
  if(!memberId)throw new Error("Fixture missing active learner member");
  await updateProjectMember(admin,project.id,memberId,{roleLabel:"Delivery contributor"});
  const denied=await getMentorPortfolioActivity(mentor,{
    projectId:project.id,view:"TEAM",
  });
  expect(denied.items.some(row=>row.label==="Project team member updated")).toBe(true);
  await expect(updateProjectMember(learner,project.id,memberId,{
    roleLabel:"Malicious label",
  })).rejects.toBeDefined();
  await endProjectMember(admin,project.id,memberId);
  const liveRoster=await listProjectMembers(mentor,project.id);
  expect(liveRoster.map(row=>row.id)).not.toContain(memberId);
  expect(liveRoster.every(row=>row.role==="MENTOR")).toBe(true);
  const rows=await pool.query<{event_type:string;metadata:Record<string,string>;
    subject_label:string;college_id:string}>(`select event_type,metadata,subject_label,college_id
    from activity_events where subject_type='project_member' and subject_id=$1`,[memberId]);
  expect(rows.rows.map(row=>row.event_type).sort()).toEqual([
    "projects.team_member.added","projects.team_member.ended",
    "projects.team_member.updated",
  ]);
  for(const row of rows.rows){
    expect(row.college_id).toBe(SEED_IDS.collegeA);
    expect(row.subject_label).toBe("Project team membership");
    expect(row.metadata).toEqual({projectId:project.id,projectMemberId:memberId,role:"LEARNER"});
    expect(JSON.stringify(row.metadata)).not.toContain(SEED_IDS.learnerCollegeAMembership);
  }
  const after=await getMentorPortfolioActivity(mentor,{projectId:project.id,view:"TEAM"});
  expect(after.items.some(row=>row.label==="Project team membership ended")).toBe(true);
  expect(after.items.every(row=>row.projectId===project.id)).toBe(true);
 });


 it("denies Learner/foreign Resource edits without persisting audit or changing content",async()=>{
  const {project}=await fixture();
  const created=await createProjectResource(admin,project.id,{
    title:"Bound resource",description:"Stored safely",required:true,
  });
  await expect(updateProjectResource(learner,project.id,created.id,{
    title:"Unauthorized edit",
  })).rejects.toBeDefined();
  await expect(archiveProjectResource(learner,project.id,created.id)).rejects.toBeDefined();
  const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
    id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(updateProjectResource(foreign,project.id,created.id,{
    title:"Wrong college",
  })).rejects.toBeDefined();
  const resource=await pool.query<{title:string;status:string}>(
    "select title,status from project_resources where id=$1",[created.id],
  );
  expect(resource.rows).toEqual([{title:"Bound resource",status:"ACTIVE"}]);
  const events=await pool.query<{event_type:string}>(
    "select event_type from activity_events where subject_type='project_resource' and subject_id=$1",[created.id],
  );
  expect(events.rows).toEqual([{event_type:"projects.resource.created"}]);
  await expect(getMentorPortfolioActivity(learner,{
    projectId:project.id,view:"RESOURCES",
  })).rejects.toBeDefined();
 });

 it("writes all three Resource event types atomically and exposes only redacted Mentor labels",async()=>{
  const {project}=await fixture();
  const created=await createProjectResource(admin,project.id,{
    title:"Resource with sensitive URL",description:"Internal body",
    url:"https://example.org/private?token=secret",required:true,
  });
  const updated=await updateProjectResource(admin,project.id,created.id,{
    title:"Renamed resource",required:false,
  });
  expect(updated.id).toBe(created.id);
  await archiveProjectResource(admin,project.id,created.id);
  const events=await pool.query<{event_type:string;metadata:Record<string,string>;
    summary:string;college_id:string;organization_id:string}>(
    "select event_type,metadata,summary,college_id,organization_id from activity_events where subject_type='project_resource' and subject_id=$1 order by occurred_at,id",
    [created.id],
  );
  expect(events.rows.map(row=>row.event_type).sort()).toEqual([
    "projects.resource.archived","projects.resource.created","projects.resource.updated",
  ]);
  for(const row of events.rows){
    expect(row.college_id).toBe(SEED_IDS.collegeA);
    expect(row.organization_id).toBe(SEED_IDS.organization);
    // Audit metadata now carries redacted before/after resource records; the
    // private URL and description must still never be persisted in clear.
    expect(row.metadata).toMatchObject({projectId:project.id,resourceId:created.id});
    expect(JSON.stringify(row)).not.toContain("token=secret");
    expect(JSON.stringify(row)).not.toContain("Internal body");
  }
  const timeline=await getMentorPortfolioActivity(mentor,{projectId:project.id,view:"RESOURCES"});
  expect(timeline.items.filter(item=>item.projectId===project.id)).toHaveLength(3);
  expect(timeline.items.every(item=>!item.label.includes("sensitive"))).toBe(true);
 });

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
