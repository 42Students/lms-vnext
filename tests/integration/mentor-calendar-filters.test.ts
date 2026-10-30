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
import {listMyMentorCalendarMeetings} from "@/modules/projects/mentor-calendar-service";
import {mentorCalendarCsv} from "@/modules/projects/mentor-calendar-export-model";
import {getMentorTeamMeetings} from "@/modules/projects/mentor-team-meetings-service";
import {getMentorTeamHistory} from "@/modules/projects/mentor-team-history-service";
import {getMentorTeamCoverage} from "@/modules/projects/mentor-team-coverage-service";
import {filterMentorCalendar,mentorCalendarFiltersSchema}
  from "@/modules/projects/mentor-calendar-filter-model";
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
    // Meeting history and task/resource children must go before their FK parents.
    for(const table of ["project_meeting_history","project_delivery_events",
      "project_evaluations","project_submission_reviews","project_task_submissions",
      "project_task_comments","project_submissions","project_meetings",
      "project_members","project_resource_audit","project_resources","project_tasks",
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
  const template=await createProjectTemplate(root,{slug:"chat11-calendar-t-"+suffix,
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
    templateId:template.template.id,slug:"chat11-calendar-p-"+suffix,title:"Export project "+suffix});
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.facultyCollegeAMembership,
    role:"MENTOR",isPrimary:true});
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.learnerCollegeAMembership,
    role:"LEARNER"});
  const view=await getProjectInstanceWorkspace(mentor,project.id);
  return {project,sprint:view.sprints[0]!};
}
describe("Mentor global calendar filters — migrated PostgreSQL",()=>{
  it("shows current same-college meetings, literal search and denied actors",async()=>{
    const {project}=await fixture();
    const meetingId=randomUUID(),secondId=randomUUID();
    await pool.query(`insert into project_meetings
      (id,project_id,status,meeting_type,title,starts_at,ends_at,time_zone,
       requested_by_membership_id,created_by_user_id,scheduled_by_user_id,
       scheduled_by_membership_id,meeting_url)
       values ($1,$2,'REQUESTED','GENERAL','Review checkpoint',
         '2026-11-01T08:00:00Z','2026-11-01T09:00:00Z','Asia/Kolkata',$3,$4,null,null,null),
              ($5,$2,'SCHEDULED','GENERAL','Practice session',
         '2026-11-02T08:00:00Z','2026-11-02T09:00:00Z','Asia/Kolkata',$3,$4,$6,$7,
         'https://meet.example.org/room')`,[
        meetingId,project.id,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser,secondId,
        SEED_IDS.facultyUser,SEED_IDS.facultyCollegeAMembership,
      ]);
    const staffed=await getMentorTeamCoverage(mentor,{
      filter:"HAS_LEARNERS",search:project.title,page:1,
    });
    expect(staffed.items).toEqual([expect.objectContaining({projectId:project.id})]);
    const primary=await getMentorTeamCoverage(mentor,{
      filter:"HAS_PRIMARY_MENTOR",search:project.title,page:1,
    });
    expect(primary.items).toHaveLength(1);
    await expect(getMentorTeamCoverage(learner,{
      filter:"HAS_LEARNERS",search:"",page:1,
    })).rejects.toBeDefined();
    const learners=await getMentorTeamHistory(mentor,{
      projectId:project.id,view:"ALL",role:"LEARNER",page:1,
    });
    expect(learners.items.every(row=>row.role==="LEARNER")).toBe(true);
    expect(learners.items.length).toBeGreaterThan(0);
    const mentors=await getMentorTeamHistory(mentor,{
      projectId:project.id,view:"ALL",role:"MENTOR",page:1,
    });
    expect(mentors.items.every(row=>row.role==="MENTOR")).toBe(true);
    const primaryMentors=await getMentorTeamHistory(mentor,{
      projectId:project.id,primary:"PRIMARY",role:"ALL",view:"ALL",page:1,
    });
    expect(primaryMentors.items).toEqual([expect.objectContaining({role:"MENTOR",isPrimary:true})]);
    await expect(getMentorTeamHistory(learner,{
      projectId:project.id,view:"ALL",role:"LEARNER",page:1,
    })).rejects.toBeDefined();
    const all=await listMyMentorCalendarMeetings(mentor);
    const owned=all.filter(row=>row.projectId===project.id);
    expect(owned).toHaveLength(2);
    const byProject=filterMentorCalendar(owned,mentorCalendarFiltersSchema.parse({projectId:project.id}));
    expect(byProject).toHaveLength(2);
    expect(filterMentorCalendar(owned,mentorCalendarFiltersSchema.parse({projectId:randomUUID()}))).toHaveLength(0);
    const safeLinks=filterMentorCalendar(owned,mentorCalendarFiltersSchema.parse({join:"HAS_SAFE_LINK"}));
    expect(safeLinks.map(row=>row.id)).toEqual([secondId]);
    const missingLinks=filterMentorCalendar(owned,mentorCalendarFiltersSchema.parse({join:"NO_SAFE_LINK"}));
    expect(missingLinks.map(row=>row.id)).toEqual([meetingId]);
    expect(filterMentorCalendar(owned,mentorCalendarFiltersSchema.parse({sprint:"LINKED"}))).toHaveLength(0);
    const csv=mentorCalendarCsv(owned,0);
    expect(csv).toContain("IST");
    expect(csv).not.toContain("https://meet.example.org/room");
    const query=mentorCalendarFiltersSchema.parse({status:"REQUESTED",search:"checkpoint"});
    expect(filterMentorCalendar(owned,query).map(row=>row.id)).toEqual([meetingId]);
    expect(filterMentorCalendar(owned,{status:"ALL",search:"nonsense",period:"ALL"})).toEqual([]);
    const inNovember=filterMentorCalendar(owned,{...query,period:"NEXT_7_DAYS"},
      new Date("2026-11-01T00:00:00Z"));
    expect(inNovember.map(row=>row.id)).toEqual([meetingId]);
    const selected=await getMentorTeamMeetings(mentor,{
      projectId:project.id,status:"REQUESTED",search:"checkpoint",page:1,
    });
    expect(selected.total).toBe(1);
    expect(selected.items.map(row=>row.id)).toEqual([meetingId]);
    expect((await getMentorTeamMeetings(mentor,{projectId:project.id,type:"GENERAL"})).total).toBe(2);
    expect((await getMentorTeamMeetings(mentor,{projectId:project.id,type:"RETRO"})).total).toBe(0);
    expect((await getMentorTeamMeetings(mentor,{projectId:project.id,outcome:"NOT_RECORDED"})).total).toBe(2);
    expect((await getMentorTeamMeetings(mentor,{projectId:project.id,outcome:"RECORDED"})).total).toBe(0);
    const literal=await getMentorTeamMeetings(mentor,{
      projectId:project.id,search:"%",page:1,
    });
    expect(literal.total).toBe(0);
    await expect(getMentorTeamMeetings(learner,{
      projectId:project.id,search:"",page:1,
    })).rejects.toBeDefined();
    await expect(listMyMentorCalendarMeetings(learner)).rejects.toBeDefined();
    const disabled:RequestContext={...mentor,user:{...mentor.user,platformStatus:"DISABLED"}};
    await expect(listMyMentorCalendarMeetings(disabled)).rejects.toBeDefined();
    const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
      id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
    const foreignRows=await listMyMentorCalendarMeetings(foreign);
    expect(foreignRows.some(row=>row.projectId===project.id)).toBe(false);
  });
});
