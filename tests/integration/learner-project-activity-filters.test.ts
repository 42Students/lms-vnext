import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getProjectActivityPage, listProjectActivity } from "@/modules/projects/activity-service";
import {getMentorWeekActivityTotals} from "@/modules/projects/mentor-week-activity-totals-service";
import {getMentorTeamRecentActorActivity} from "@/modules/projects/mentor-team-recent-actor-service";
import {searchMentorWorkspacePage} from "@/modules/projects/mentor-unified-search-service";
import {getMentorLearnerAcademicFacts} from "@/modules/projects/mentor-learner-academic-facts-service";
import {postMentorProjectUpdate} from "@/modules/projects/mentor-project-update-service";
import {markAllMentorUnifiedNotificationsRead}
  from "@/modules/projects/mentor-unified-notification-read-all-service";
import { filterLearnerProjectActivity } from "@/modules/projects/learner-project-activity-filter-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
if (!process.env.TEST_DATABASE_URL) throw new Error("Requires disposable TEST_DATABASE_URL");
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const ids = {
  college:randomUUID(), learner:randomUUID(), membership:randomUUID(),
  department:randomUUID(),program:randomUUID(),period:randomUUID(),
  cohort:randomUUID(),enrollment:randomUUID(),
  role:randomUUID(), mentor:randomUUID(), mentorMembership:randomUUID(),
  mentorRole:randomUUID(), template:randomUUID(), version:randomUUID(),
  assignment:randomUUID(), project:randomUUID(), projectMember:randomUUID(),
  mentorProjectMember:randomUUID(),
  release:randomUUID(),sprint:randomUUID(),taskA:randomUUID(),taskB:randomUUID(),
};
const suffix = ids.college.slice(0,8);
const context:RequestContext={
  user:{id:ids.learner,identityUid:"chat7-learner-"+suffix,platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:ids.membership,collegeId:ids.college,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
const mentorContext:RequestContext={
  user:{id:ids.mentor,identityUid:"chat7-mentor-"+suffix,platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:ids.mentorMembership,collegeId:ids.college,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["MENTOR"]},
};
async function setup() {
  await pool.query("insert into colleges(id,organization_id,name,code) values($1,$2,$3,$4)",
    [ids.college,SEED_IDS.organization,"Chat7 College "+suffix,"C7-"+suffix]);
  for(const [user,membership,role,roleName] of [
    [ids.learner,ids.membership,ids.role,"LEARNER"],
    [ids.mentor,ids.mentorMembership,ids.mentorRole,"MENTOR"],
  ]) {
    await pool.query("insert into users(id,identity_uid,display_name) values($1,$2,$3)",
      [user,"chat7-"+user,user===ids.mentor?"Own Mentor":"Own Learner"]);
    await pool.query("insert into college_memberships(id,user_id,college_id) values($1,$2,$3)",
      [membership,user,ids.college]);
    await pool.query("insert into membership_roles(id,membership_id,role) values($1,$2,$3)",
      [role,membership,roleName]);
  }
  // Produce all academic parentage locally, including the learner's enrollment.
  await pool.query("insert into departments(id,college_id,name) values($1,$2,'Own Project Test Department')",
    [ids.department,ids.college]);
  await pool.query(`insert into programs(id,department_id,name,code,duration_terms)
    values($1,$2,'Own Project Program',$3,8)`,
    [ids.program,ids.department,"P7-"+suffix]);
  await pool.query(`insert into academic_periods
    (id,college_id,name,code,start_date,end_date,status)
    values($1,$2,'Own Project Term',$3,'2026-07-01','2026-12-31','ACTIVE')`,
    [ids.period,ids.college,"T7-"+suffix]);
  await pool.query(`insert into cohorts(id,program_id,name,code,start_period_id,status)
    values($1,$2,'Own Project Cohort',$3,$4,'ACTIVE')`,
    [ids.cohort,ids.program,"B7-"+suffix,ids.period]);
  await pool.query(`insert into learner_program_enrollments
    (id,membership_id,program_id,cohort_id,status)
    values($1,$2,$3,$4,'ACTIVE')`,
    [ids.enrollment,ids.membership,ids.program,ids.cohort]);
  // Minimal project-template lineage is per-test and is not a shared seeded project.
  await pool.query(`insert into project_templates
    (id,slug,title,status,created_by_user_id) values ($1,$2,'Chat7 Template','PUBLISHED',$3)`,
    [ids.template,"chat7-"+suffix,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_template_versions
    (id,template_id,version,title,blueprint,created_by_user_id)
    values($1,$2,1,'Chat7 Template','{}'::jsonb,$3)`,
    [ids.version,ids.template,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_template_college_assignments
    (id,template_id,template_version_id,college_id,assigned_by_user_id)
    values($1,$2,$3,$4,$5)`,
    [ids.assignment,ids.template,ids.version,ids.college,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_instances
    (id,college_id,template_id,template_version_id,slug,title,created_by_user_id)
    values($1,$2,$3,$4,$5,'Chat7 own project',$6)`,
    [ids.project,ids.college,ids.template,ids.version,"chat7-own-"+suffix,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_members
    (id,project_id,membership_id,role,created_by_user_id)
    values($1,$2,$3,'LEARNER',$4)`,
    [ids.projectMember,ids.project,ids.membership,SEED_IDS.superAdminUser]);
  await pool.query(`insert into project_members
    (id,project_id,membership_id,role,is_primary,created_by_user_id)
    values($1,$2,$3,'MENTOR',true,$4)`,
    [ids.mentorProjectMember,ids.project,ids.mentorMembership,SEED_IDS.superAdminUser]);
}

beforeAll(async () => {
  await setup();
  for (const [eventType, collegeId] of [
    ["projects.sprint.updated", ids.college], ["projects.task.created", ids.college],
    ["projects.task.submitted", ids.college], ["projects.delivery.reviewed", ids.college], ["projects.sprint.updated", SEED_IDS.collegeB],
  ]) await pool.query(`INSERT INTO activity_events
    (id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary)
    VALUES($1,$2,$3,$4,'PROJECTS',$5,'project',$6,'Fixture activity')`,
    [randomUUID(),SEED_IDS.organization,collegeId,SEED_IDS.superAdminUser,eventType,ids.project]);
}, 45000);
afterAll(async () => {
  // Preserve append-only events and referenced identities; discard the entire isolated DB later.
  await pool.end(); await closeDatabaseConnection();
}, 30000);
describe("learner Project Activity categories over persisted own events", () => {
  it("includes only own-college Project events and composes category filtering", async () => {
    const events = await listProjectActivity(context, ids.project);
    expect(events).toHaveLength(4);
    expect(filterLearnerProjectActivity(events, "SPRINT").map(event => event.eventType)).toEqual(["projects.sprint.updated"]);
    expect(filterLearnerProjectActivity(events, "SUBMISSION").map(event => event.eventType)).toEqual(["projects.delivery.reviewed"]);
    expect(filterLearnerProjectActivity(events, "RESOURCE")).toEqual([]);
  });
  it("denies foreign-college, suspended and wrong-role contexts without returning data", async () => {
    for (const actor of [
      { ...context, membership: { ...context.membership!, collegeId: SEED_IDS.collegeB } },
      { ...context, membership: { ...context.membership!, status: "SUSPENDED" } },
      { ...context, membership: { ...context.membership!, roles: ["FACULTY"] } },
    ] as RequestContext[]) await expect(listProjectActivity(actor, ids.project)).rejects.toBeDefined();
    await expect(listProjectActivity(context, randomUUID())).rejects.toBeDefined();
  });
});

describe("Project Activity date filters precede the PostgreSQL row cap", () => {
  it("finds an older own event even beyond the default latest-100 page", async () => {
    const older = randomUUID();
    await pool.query(`INSERT INTO activity_events
      (id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary,occurred_at)
      VALUES($1,$2,$3,$4,'PROJECTS','projects.resource.created','project',$5,'Older matching event','2026-10-13T18:30:00Z')`,
      [older,SEED_IDS.organization,ids.college,SEED_IDS.superAdminUser,ids.project]);
    await pool.query(`INSERT INTO activity_events
      (id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary,occurred_at)
      SELECT gen_random_uuid(),$1::uuid,$2::uuid,$3::uuid,'PROJECTS','projects.task.created','project',$4::text,
        'Newer unrelated event','2026-10-14T18:30:00Z'::timestamptz FROM generate_series(1,101)`,
      [SEED_IDS.organization,ids.college,SEED_IDS.superAdminUser,ids.project]);
    const filtered = await listProjectActivity(context, ids.project, {
      category: "RESOURCE", from: "2026-10-14", to: "2026-10-14",
    });
    expect(filtered.map(event => event.id)).toEqual([older]);
    expect(await listProjectActivity(context, ids.project, {
      category: "RESOURCE", from: "2026-10-15", to: "2026-10-15",
    })).toEqual([]);
    await expect(listProjectActivity(context, ids.project, { from: "2026-10-15", to: "2026-10-14" })).rejects.toBeDefined();
    for (const actor of [
      { ...context, membership: { ...context.membership!, collegeId: SEED_IDS.collegeB } },
      { ...context, membership: { ...context.membership!, status: "SUSPENDED" } },
      { ...context, membership: { ...context.membership!, roles: ["FACULTY"] } },
    ] as RequestContext[]) await expect(listProjectActivity(actor, ids.project, { from: "2026-10-14" })).rejects.toBeDefined();
  });
});

describe("Project Activity cursor pages on equal microsecond timestamps", () => {
  it("continues beyond 100 own events without duplicates, gaps or foreign access", async () => {
    await pool.query(`INSERT INTO activity_events
      (id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary,occurred_at)
      SELECT gen_random_uuid(),$1::uuid,$2::uuid,$3::uuid,'PROJECTS','projects.task.created','project',$4::text,
        'Cursor fixture','2026-10-15T18:30:00.123456Z'::timestamptz FROM generate_series(1,101)`,
      [SEED_IDS.organization,ids.college,SEED_IDS.superAdminUser,ids.project]);
    const filters = { category: "TASK", from: "2026-10-16", to: "2026-10-16" };
    const first = await getProjectActivityPage(context, ids.project, filters);
    expect(first.events).toHaveLength(100);
    expect(first.hasMore).toBe(true);
    const cursor = first.events.at(-1)!;
    expect(cursor.cursorOccurredAt).toBe("2026-10-15T18:30:00.123456Z");
    const nextFilters = { ...filters, beforeTime: cursor.cursorOccurredAt, beforeId: cursor.id };
    const second = await getProjectActivityPage(context, ids.project, nextFilters);
    expect(second.events).toHaveLength(1);
    expect(second.hasMore).toBe(false);
    const allIds = [...first.events, ...second.events].map(event => event.id);
    expect(new Set(allIds).size).toBe(101);
    const persisted = await pool.query<{ id: string }>(`SELECT id FROM activity_events
      WHERE college_id=$1 AND subject_id=$2::text AND summary='Cursor fixture'`, [ids.college, ids.project]);
    expect([...allIds].sort()).toEqual(persisted.rows.map(row => row.id).sort());
    for (const actor of [
      { ...context, membership: { ...context.membership!, collegeId: SEED_IDS.collegeB } },
      { ...context, membership: { ...context.membership!, status: "SUSPENDED" } },
      { ...context, membership: { ...context.membership!, roles: ["FACULTY"] } },
    ] as RequestContext[]) await expect(getProjectActivityPage(actor, ids.project, nextFilters)).rejects.toBeDefined();
  });
});

describe("Mentor sprint-scoped persisted activity pagination",()=>{
  it("paginates matching sprint and actor across 100+ events without leaking unrelated records",async()=>{
    // These events share one persisted sprint ID and the same microsecond.
    // The filter must be applied in PostgreSQL before the row cap.
    const otherSprint=randomUUID();
    const subject=randomUUID();
    const insert=await pool.query(`INSERT INTO activity_events
      (id,organization_id,college_id,actor_user_id,module,event_type,
       subject_type,subject_id,summary,metadata,occurred_at)
      SELECT gen_random_uuid(),$1::uuid,$2::uuid,$3::uuid,'PROJECTS',
        'projects.task.status_changed','project_task',$4::text,
        'Sprint-scoped cursor fixture',
        jsonb_build_object('projectId',$5::text,'sprintId',$6::text),
        '2026-10-20T10:00:00.123456Z'::timestamptz
      FROM generate_series(1,101)`,
      [SEED_IDS.organization,ids.college,SEED_IDS.superAdminUser,
       subject,ids.project,ids.sprint]);
    expect(insert.rowCount).toBe(101);
    for(const [college,actor,sprint] of [
      [ids.college,ids.mentor,ids.sprint],
      [ids.college,SEED_IDS.superAdminUser,otherSprint],
      [SEED_IDS.collegeB,SEED_IDS.superAdminUser,ids.sprint],
    ]){
      await pool.query(`INSERT INTO activity_events
        (id,organization_id,college_id,actor_user_id,module,event_type,
         subject_type,subject_id,summary,metadata,occurred_at)
        VALUES($1,$2,$3,$4,'PROJECTS','projects.task.status_changed',
         'project_task',$5,'Other sprint actor or tenant',
         jsonb_build_object('projectId',$6::text,'sprintId',$7::text),
         '2026-10-20T10:00:00.123456Z')`,
        [randomUUID(),SEED_IDS.organization,college,actor,subject,ids.project,sprint]);
    }
    const match={sprintId:ids.sprint,actorUserId:SEED_IDS.superAdminUser,size:100};
    const first=await getProjectActivityPage(context,ids.project,match);
    expect(first.events).toHaveLength(100);
    expect(first.hasMore).toBe(true);
    const cursor=first.events.at(-1)!;
    const second=await getProjectActivityPage(context,ids.project,{
      ...match,beforeTime:cursor.cursorOccurredAt,beforeId:cursor.id,
    });
    expect(second.events).toHaveLength(1);
    expect(second.hasMore).toBe(false);
    const all=[...first.events,...second.events];
    expect(new Set(all.map(event=>event.id)).size).toBe(101);
    expect(all.every(event=>event.sprintId===ids.sprint&&
      event.actorUserId===SEED_IDS.superAdminUser)).toBe(true);
    const otherActor=await getProjectActivityPage(context,ids.project,{
      sprintId:ids.sprint,actorUserId:ids.mentor,
    });
    expect(otherActor.events).toHaveLength(1);
    expect((await getProjectActivityPage(context,ids.project,{
      sprintId:otherSprint,actorUserId:ids.mentor,
    })).events).toHaveLength(0);
    expect((await getProjectActivityPage(context,ids.project,{
      sprintId:randomUUID(),
    })).events).toHaveLength(0);
    await expect(getProjectActivityPage(context,randomUUID(),match)).rejects.toBeDefined();
  });
});

describe("Mentor full-week project activity counters",()=>{
  it("counts 100+ recorded events, not only the first activity page",async()=>{
    const timestamp="2026-11-10T09:00:00Z";
    for(const [kind,count] of [
      ["projects.task.status_changed",105],
      ["projects.task.comment.created",3],
      ["projects.resource.created",2],
    ] as const){
      await pool.query(`INSERT INTO activity_events
        (id,organization_id,college_id,actor_user_id,module,event_type,
         subject_type,subject_id,summary,occurred_at)
        SELECT gen_random_uuid(),$1::uuid,$2::uuid,$3::uuid,'PROJECTS',
          $4,'project',$5,'Weekly historical activity',$6::timestamptz
        FROM generate_series(1,$7::int)`,[
        SEED_IDS.organization,ids.college,SEED_IDS.superAdminUser,
        kind,ids.project,timestamp,count,
      ]);
    }
    await pool.query(`INSERT INTO activity_events
      (id,organization_id,college_id,actor_user_id,module,event_type,
       subject_type,subject_id,summary,occurred_at)
      VALUES($1,$2,$3,$4,'PROJECTS','projects.task.status_changed',
       'project',$5,'Foreign project activity',$6::timestamptz)`,[
      randomUUID(),SEED_IDS.organization,SEED_IDS.collegeB,
      SEED_IDS.superAdminUser,ids.project,timestamp,
    ]);
    const now=new Date("2026-11-11T10:00:00Z");
    expect(await getMentorWeekActivityTotals(mentorContext,ids.project,now)).toEqual({
      taskMoves:105,comments:3,resourcesShared:2,count:110,
    });
    // The same feed in a learner context must not grant Mentor-only reports.
    await expect(getMentorWeekActivityTotals(context,ids.project,now)).rejects.toBeDefined();
    await expect(getMentorWeekActivityTotals({
      ...mentorContext,membership:{...mentorContext.membership!,
        collegeId:SEED_IDS.collegeB},
    },ids.project,now)).rejects.toBeDefined();
    await expect(getMentorWeekActivityTotals(mentorContext,randomUUID(),now))
      .rejects.toBeDefined();
  });
});

describe("Mentor Team last recorded project actions",()=>{
  it("shows actual authored events rather than unrelated task updates or another project's actions",async()=>{
    const learnerAt="2026-12-01T07:15:00.123Z";
    for(const row of [
      {actor:ids.learner,college:ids.college,subject:ids.project,
        event:"projects.task.comment.created",at:learnerAt},
      {actor:ids.learner,college:ids.college,subject:randomUUID(),
        event:"projects.task.status_changed",at:"2026-12-03T08:15:00.123Z"},
      {actor:ids.learner,college:SEED_IDS.collegeB,subject:ids.project,
        event:"projects.task.status_changed",at:"2026-12-04T08:15:00.123Z"},
    ]){
      await pool.query(`INSERT INTO activity_events
        (id,organization_id,college_id,actor_user_id,module,event_type,
         subject_type,subject_id,summary,occurred_at)
        VALUES($1,$2,$3,$4,'PROJECTS',$5,'project',$6,'Recorded participant action',$7)`,[
        randomUUID(),SEED_IDS.organization,row.college,row.actor,
        row.event,row.subject,row.at,
      ]);
    }
    const last=await getMentorTeamRecentActorActivity(
      mentorContext,ids.project,[{userId:ids.learner},{userId:ids.mentor}],
    );
    expect(last[ids.learner]).toBe(learnerAt);
    expect(last[ids.mentor]===undefined||
      Number.isFinite(Date.parse(last[ids.mentor]!))).toBe(true);
    await expect(getMentorTeamRecentActorActivity(
      context,ids.project,[{userId:ids.learner}],
    )).rejects.toBeDefined();
    await expect(getMentorTeamRecentActorActivity(
      {...mentorContext,membership:{...mentorContext.membership!,
        collegeId:SEED_IDS.collegeB}},ids.project,[{userId:ids.learner}],
    )).rejects.toBeDefined();
    expect(await getMentorTeamRecentActorActivity(mentorContext,ids.project,[]))
      .toEqual({});
  });
});

describe("Mentor project Team student academic scope",()=>{
  it("reads only current project learners and their persisted academic labels",async()=>{
    await pool.query(`INSERT INTO learner_profiles(membership_id,roll_number,
      registration_number)VALUES($1,$2,$3)
      ON CONFLICT(membership_id) DO UPDATE
      SET roll_number=excluded.roll_number,
        registration_number=excluded.registration_number`,[
      ids.membership,"ROLL-2026","REG-2026",
    ]);
    const rows=await getMentorLearnerAcademicFacts(mentorContext,ids.project);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      membershipId:ids.membership,registrationNumber:"REG-2026",
      rollNumber:"ROLL-2026",departmentName:"Own Project Test Department",
      programName:"Own Project Program",cohortName:"Own Project Cohort",
    });
    await expect(getMentorLearnerAcademicFacts(context,ids.project))
      .rejects.toBeDefined();
    await expect(getMentorLearnerAcademicFacts({
      ...mentorContext,membership:{...mentorContext.membership!,
        collegeId:SEED_IDS.collegeB},
    },ids.project)).rejects.toBeDefined();
    await expect(getMentorLearnerAcademicFacts(mentorContext,randomUUID()))
      .rejects.toBeDefined();
  });
});

describe("Legacy project Sprint audit without metadata",()=>{
  it("recovers only events for a Sprint actually owned by this authorized project",async()=>{
    await pool.query(`INSERT INTO project_releases
      (id,project_id,template_key,title,sequence)
      VALUES($1,$2,'mentor-legacy-release','Legacy release',0)`,[
      ids.release,ids.project,
    ]);
    await pool.query(`INSERT INTO project_sprints
      (id,project_id,release_id,template_key,title,sequence)
      VALUES($1,$2,$3,'mentor-legacy-sprint','Legacy sprint',0)`,[
      ids.sprint,ids.project,ids.release,
    ]);
    const legacyId=randomUUID(),unrelatedId=randomUUID();
    for(const row of [
      {id:legacyId,college:ids.college,subject:ids.sprint},
      {id:unrelatedId,college:ids.college,subject:randomUUID()},
      {id:randomUUID(),college:SEED_IDS.collegeB,subject:ids.sprint},
    ]){
      await pool.query(`INSERT INTO activity_events
        (id,organization_id,college_id,actor_user_id,module,event_type,
         subject_type,subject_id,summary,occurred_at)
        VALUES($1,$2,$3,$4,'PROJECTS','projects.sprint.updated',
          'project_sprint',$5,'Legacy sprint event without project metadata',
          '2026-09-18T09:00:00Z')`,[
        row.id,SEED_IDS.organization,row.college,
        SEED_IDS.superAdminUser,row.subject,
      ]);
    }
    const result=await getProjectActivityPage(context,ids.project,{
      sprintId:ids.sprint,from:"2026-09-18",to:"2026-09-18",
    });
    expect(result.events.map(row=>row.id)).toContain(legacyId);
    expect(result.events.map(row=>row.id)).not.toContain(unrelatedId);
    // History survives an archived/deleted Sprint without widening tenant access.
    await pool.query("UPDATE project_sprints SET deleted_at=now() WHERE id=$1",
      [ids.sprint]);
    const historical=await getProjectActivityPage(context,ids.project,{
      sprintId:ids.sprint,from:"2026-09-18",to:"2026-09-18",
    });
    expect(historical.events.map(row=>row.id)).toContain(legacyId);
    await expect(getProjectActivityPage({
      ...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB},
    },ids.project,{sprintId:ids.sprint})).rejects.toBeDefined();
  });
});

describe("Mentor project updates: atomic activity, recipients and posting limits",()=>{
  it("persists one event per post and notifies only active project recipients",async()=>{
    await pool.query("UPDATE project_instances SET status='ACTIVE' WHERE id=$1",[ids.project]);
    try{
      await expect(postMentorProjectUpdate(context,ids.project,{
        message:"A learner cannot author Mentor updates",
      })).rejects.toBeDefined();
      await expect(postMentorProjectUpdate({
        ...mentorContext,membership:{...mentorContext.membership!,
          collegeId:SEED_IDS.collegeB},
      },ids.project,{message:"Foreign college"})).rejects.toBeDefined();
      await expect(postMentorProjectUpdate(mentorContext,randomUUID(),{
        message:"Different project",
      })).rejects.toBeDefined();
      await expect(postMentorProjectUpdate(mentorContext,ids.project,{
        message:"   ",
      })).rejects.toBeDefined();
      await pool.query("UPDATE project_members SET ended_at=now() WHERE id=$1",
        [ids.mentorProjectMember]);
      try{
        await expect(postMentorProjectUpdate(mentorContext,ids.project,{
          message:"Removed Mentor cannot post",
        })).rejects.toBeDefined();
      }finally{
        await pool.query("UPDATE project_members SET ended_at=null WHERE id=$1",
          [ids.mentorProjectMember]);
      }

      const first=await postMentorProjectUpdate(mentorContext,ids.project,{
        message:"Project week 1: sprint tasks ready",
      });
      const duplicate=await postMentorProjectUpdate(mentorContext,ids.project,{
        message:"Project week 1: sprint tasks ready",
      });
      expect(duplicate.id).toBe(first.id);
      const learnerNotice=await pool.query<{
        user_id:string;action_href:string;
      }>(`SELECT n.user_id,n.action_href FROM in_app_notifications n
         WHERE n.event_id=$1`,[first.id]);
      expect(learnerNotice.rows).toEqual([{
        user_id:ids.learner,
        action_href:"/learn/projects/"+ids.project+"?tab=activity",
      }]);
      const [ownCount]= (await pool.query<{total:string}>(`select
        count(*)::text as total from in_app_notifications
        where event_id=$1 and user_id=$2`,[first.id,ids.mentor])).rows;
      expect(ownCount?.total).toBe("0");

      await postMentorProjectUpdate(mentorContext,ids.project,{
        message:"Project week 1: office hours scheduled",
      });
      const third=await postMentorProjectUpdate(mentorContext,ids.project,{
        message:"Project week 1: evidence checklist",
      });
      const retryAfterQuota=await postMentorProjectUpdate(mentorContext,ids.project,{
        message:"Project week 1: evidence checklist",
      });
      expect(retryAfterQuota.id).toBe(third.id);
      await expect(postMentorProjectUpdate(mentorContext,ids.project,{
        message:"Spam must not be published",
      })).rejects.toMatchObject({code:"PROJECT_UPDATE_RATE_LIMITED"});
      const events=await pool.query<{summary:string}>(`select summary from activity_events
        where event_type='projects.mentor_update.posted'
          and subject_id=$1 and actor_user_id=$2`,[ids.project,ids.mentor]);
      expect(events.rows).toHaveLength(3);
      expect(events.rows.map(row=>row.summary))
        .not.toContain("Spam must not be published");

      await pool.query("UPDATE project_instances SET status='ARCHIVED' WHERE id=$1",
        [ids.project]);
      await expect(postMentorProjectUpdate(mentorContext,ids.project,{
        message:"Archived projects cannot be posted to",
      })).rejects.toBeDefined();
    }finally{
      await pool.query("UPDATE project_instances SET status='PLANNED' WHERE id=$1",
        [ids.project]);
    }
  });
});

describe("Mentor unified personal and source mark-all",()=>{
  it("acknowledges all eligible recipient messages, not just page 1 or another user",async()=>{
    // More than one 50-item personal inbox page, with isolated recipient grants.
    const records=await pool.query<{id:string}>(`INSERT INTO activity_events
      (id,organization_id,college_id,actor_user_id,module,event_type,
       subject_type,subject_id,summary)
      SELECT gen_random_uuid(),$1::uuid,$2::uuid,$3::uuid,'PROJECTS',
        'projects.task.created','project',$4,'Notification pagination test'
      FROM generate_series(1,74) RETURNING id`,[
      SEED_IDS.organization,ids.college,SEED_IDS.superAdminUser,ids.project,
    ]);
    for(const record of records.rows){
      await pool.query(`INSERT INTO in_app_notifications
        (id,user_id,event_id,title,body)
        VALUES($1,$2,$3,'Project event','Persisted personal notification')`,[
        randomUUID(),ids.mentor,record.id,
      ]);
    }
    const other=await pool.query<{id:string}>(`INSERT INTO activity_events
      (id,organization_id,college_id,actor_user_id,module,event_type,
       subject_type,subject_id,summary)
      VALUES($1,$2,$3,$4,'PROJECTS','projects.task.created','project',$5,
        'Learner-only inbox event') RETURNING id`,[
      randomUUID(),SEED_IDS.organization,ids.college,SEED_IDS.superAdminUser,ids.project,
    ]);
    await pool.query(`INSERT INTO in_app_notifications
      (id,user_id,event_id,title,body)
      VALUES($1,$2,$3,'Learner event','Learner inbox message')`,[
      randomUUID(),ids.learner,other.rows[0]!.id,
    ]);

    const first=await markAllMentorUnifiedNotificationsRead(mentorContext);
    expect(first.markedPersonal).toBeGreaterThanOrEqual(74);
    expect(first.completeForCurrentVisibleSources).toBe(true);
    const unread=await pool.query<{count:string}>(`select count(*)::text as count
      from in_app_notifications where user_id=$1 and read_at is null`,[ids.mentor]);
    expect(unread.rows[0]?.count).toBe("0");
    const learnerUnread=await pool.query<{count:string}>(`select count(*)::text as count
      from in_app_notifications where user_id=$1 and event_id=$2 and read_at is null`,
      [ids.learner,other.rows[0]!.id]);
    expect(learnerUnread.rows[0]?.count).toBe("1");
    const second=await markAllMentorUnifiedNotificationsRead(mentorContext);
    expect(second.markedPersonal).toBe(0);
    expect(second.markedSources).toBe(0);
    // Two tabs acknowledging the same inbox are serialized by the user-bound
    // advisory lock; neither should duplicate receipts or regress read state.
    const concurrent=await Promise.all([
      markAllMentorUnifiedNotificationsRead(mentorContext),
      markAllMentorUnifiedNotificationsRead(mentorContext),
    ]);
    expect(concurrent.every(row=>row.markedPersonal===0&&row.markedSources===0))
      .toBe(true);
    await expect(markAllMentorUnifiedNotificationsRead(context)).rejects.toBeDefined();

    const newEvent=await pool.query<{id:string}>(`INSERT INTO activity_events
      (id,organization_id,college_id,actor_user_id,module,event_type,
       subject_type,subject_id,summary)
      VALUES($1,$2,$3,$4,'PROJECTS','projects.task.created','project',$5,
        'New task after bulk acknowledge') RETURNING id`,[
      randomUUID(),SEED_IDS.organization,ids.college,SEED_IDS.superAdminUser,ids.project,
    ]);
    await pool.query(`INSERT INTO in_app_notifications
      (id,user_id,event_id,title,body) VALUES
      ($1,$2,$3,'New task','Post-ack notification')`,[
      randomUUID(),ids.mentor,newEvent.rows[0]!.id,
    ]);
    const latest=await pool.query<{read_at:Date|null}>(`select read_at
      from in_app_notifications where user_id=$1 and event_id=$2`,
      [ids.mentor,newEvent.rows[0]!.id]);
    expect(latest.rows[0]?.read_at).toBeNull();
  });
});

describe("Mentor global search workspace privacy",()=>{
  it("includes only active assigned project students and revokes results on removal",async()=>{
    const project=await searchMentorWorkspacePage(mentorContext,"Chat7 own project");
    expect(project.results).toEqual(expect.arrayContaining([
      expect.objectContaining({kind:"Project",href:expect.stringContaining(ids.project)}),
    ]));
    const student=await searchMentorWorkspacePage(mentorContext,"Own Learner");
    expect(student.results).toEqual(expect.arrayContaining([
      expect.objectContaining({kind:"Student",href:expect.stringContaining(ids.project)}),
    ]));
    await pool.query("update project_members set ended_at=now() where id=$1",
      [ids.mentorProjectMember]);
    try{
      const gone=await searchMentorWorkspacePage(mentorContext,"Own Learner");
      expect(gone.results).toEqual([]);
      const noProjects=await searchMentorWorkspacePage(mentorContext,"Chat7 own project");
      expect(noProjects.results).toEqual([]);
    }finally{
      await pool.query("update project_members set ended_at=null where id=$1",
        [ids.mentorProjectMember]);
    }
    await expect(searchMentorWorkspacePage({
      ...mentorContext,membership:{...mentorContext.membership!,
        collegeId:SEED_IDS.collegeB},
    },"Own Learner")).rejects.toBeDefined();
    await expect(searchMentorWorkspacePage(context,"Own Learner"))
      .rejects.toBeDefined();
  });
});
