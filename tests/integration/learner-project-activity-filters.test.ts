import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getProjectActivityPage, listProjectActivity } from "@/modules/projects/activity-service";
import {getMentorWeekActivityTotals} from "@/modules/projects/mentor-week-activity-totals-service";
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
