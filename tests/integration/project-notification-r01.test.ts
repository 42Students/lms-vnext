import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { createProjectTemplate, assignProjectTemplateToCollege, publishProjectTemplate } from "@/modules/projects/template-service";
import { createProjectInstance, getProjectInstanceWorkspace, archiveProjectInstance } from "@/modules/projects/instance-service";
import { addProjectMember, endProjectMember, listProjectMembers } from "@/modules/projects/member-service";
import { assignProjectTaskToLearner } from "./support/projects-review-fixture";
import { listProjectAdminRiskQueue } from "@/modules/projects/admin-insights-service";
import { postProjectTaskComment } from "@/modules/projects/task-comment-service";
import { requestProjectMeeting, scheduleProjectMeeting, transitionProjectMeeting } from "@/modules/projects/meeting-service";
import { startProjectSprint } from "@/modules/projects/lifecycle-service";

const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if(enabled) assertDb018DisposableTarget(process.env, {serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const root:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"project-r01-root",
 platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
const scoped={...root,adminScope:{collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization}};
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"project-r01-admin",
 platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.collegeAdminMembership,
 collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const mentor:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"project-r01-mentor",
 platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.facultyCollegeAMembership,
 collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["MENTOR","FACULTY"]}};
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,identityUid:"project-r01-learner",
 platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.learnerCollegeAMembership,
 collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]}};

describe.skipIf(!enabled)("COL-projects-R01 / LEARNER-projects-R01 notification persistence (PG)",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("notifies scoped mentor and learner for creation, join, assignment, comment, meetings, removal and archive",async()=>{
  const suffix=randomUUID().slice(0,12);
  const templ=await createProjectTemplate(root,{slug:"project-notices-r01-"+suffix,title:"Notice template",
   blueprint:{overview:{goal:"Notice",deliverables:["Demo"]},
    releases:[{key:"r",title:"Release",sequence:0}],
    sprints:[{key:"s",releaseKey:"r",title:"Sprint",sequence:0}],
    tasks:[{key:"t",sprintKey:"s",title:"Task",priority:"HIGH" as const,sequence:0}],
    resources:[]}});
  await publishProjectTemplate(root,templ.template.id);
  await assignProjectTemplateToCollege(scoped,templ.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{collegeId:SEED_IDS.collegeA,templateId:templ.template.id,
   slug:"project-notices-r01-"+suffix,title:"Project notices",primaryMentorMembershipId:mentor.membership!.id});
  const notificationRows=async(userId:string)=>pool!.query<{title:string;action_href:string|null}>(
   `select n.title,n.action_href from in_app_notifications n
     join activity_events e on e.id=n.event_id
     where n.user_id=$1 and e.college_id=$2 and (e.metadata->>'projectId'=$3 or e.subject_id=$3)
     order by n.created_at`,[userId,SEED_IDS.collegeA,project.id]);
  expect((await notificationRows(mentor.user.id)).rows.map(row=>row.title)).toContain("New project assigned");
  const added=await addProjectMember(admin,project.id,{membershipId:learner.membership!.id,role:"LEARNER"});
  expect((await notificationRows(learner.user.id)).rows.map(row=>row.title)).toContain("Added to project");
  const initial=await getProjectInstanceWorkspace(mentor,project.id);
  const task=initial.tasks[0]!;
  await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});
  expect((await notificationRows(learner.user.id)).rows.map(row=>row.title)).toContain("New task assigned");
  // Risk reasons are reported only for ACTIVE projects; start the sprint first.
  await startProjectSprint(mentor,project.id,initial.sprints[0]!.id);
  await pool!.query("update project_tasks set status='BLOCKED',blocker_reason='Awaiting API review' where id=$1",
    [task.id]);
  const risk=await listProjectAdminRiskQueue(admin,SEED_IDS.collegeA,{
    q:"project-notices-r01-"+suffix,page:1,
  });
  const risky=risk.items.find(row=>row.id===project.id);
  expect(risky?.riskReasons).toContain("Active blocker");
  expect(risky?.blockerReason).toBe("Awaiting API review");
  const updated=(await getProjectInstanceWorkspace(mentor,project.id)).tasks[0]!;
  await postProjectTaskComment(mentor,project.id,updated.id,{
   body:"Please check the acceptance criteria.",expectedTaskUpdatedAt:updated.updatedAt.toISOString(),
  });
  expect((await notificationRows(learner.user.id)).rows.some(row=>row.title.startsWith("New comment on"))).toBe(true);

  const startsAt=new Date(Date.now()+3*24*60*60*1000).toISOString();
  const endsAt=new Date(Date.now()+3*24*60*60*1000+60*60*1000).toISOString();
  const meeting=await requestProjectMeeting(learner,project.id,{
   title:"Planning",startsAt,endsAt,timeZone:"Asia/Kolkata",
  });
  expect((await notificationRows(mentor.user.id)).rows.map(row=>row.title)).toContain("Meeting requested");
  const requestedVersion=await pool!.query<{updated_at:Date}>(
   "select updated_at from project_meetings where id=$1",[meeting.id]);
  await scheduleProjectMeeting(mentor,project.id,meeting.id,{
   title:"Planning",startsAt,endsAt,timeZone:"Asia/Kolkata",
   meetingUrl:"https://example.com/meeting",
   expectedUpdatedAt:requestedVersion.rows[0]!.updated_at.toISOString(),
  });
  expect((await notificationRows(learner.user.id)).rows.map(row=>row.title)).toContain("Project meeting");
  await transitionProjectMeeting(mentor,project.id,meeting.id,{action:"CANCEL",note:"Reschedule later"});
  await endProjectMember(admin,project.id,added.id);
  expect((await notificationRows(learner.user.id)).rows.map(row=>row.title)).toContain("Removed from project");
  await archiveProjectInstance(admin,project.id);
  expect((await notificationRows(mentor.user.id)).rows.map(row=>row.title)).toContain("Project archived");
  const duplicates=await pool!.query(
   `select user_id,event_id,count(*) from in_app_notifications where event_id in
     (select id from activity_events where metadata->>'projectId'=$1 or subject_id=$1)
     group by user_id,event_id having count(*)>1`,[project.id]);
  expect(duplicates.rows).toEqual([]);
  expect((await notificationRows(learner.user.id)).rows.every(row=>
   row.action_href?.startsWith("/")??true)).toBe(true);
  expect((await listProjectMembers(admin,project.id)).length).toBeGreaterThan(0);
 });
});
