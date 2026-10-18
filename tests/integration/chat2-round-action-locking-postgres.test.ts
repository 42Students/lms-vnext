import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  actOnPlacementRound,
  getPlacementRound,
  updatePlacementRound,
} from "@/modules/placements/round-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({
  connectionString: process.env.TEST_DATABASE_URL, max: 2,
}) : null;
const actor: RequestContext = {
  user:{id:SEED_IDS.facultyUser,identityUid:"round-locking",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{
    id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"],
  },
};
const otherCollege: RequestContext = {
  ...actor,
  membership:{
    ...actor.membership!,
    id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,
  },
};
const fixtures:{companyId:string;relationshipId:string;jobId:string;roundId:string}[] = [];
let grantedRoleId:string | undefined;

async function createRoundFixture() {
  if (!pool) throw new Error("Requires disposable PostgreSQL");
  const suffix=randomUUID();
  const [company]=(await pool.query<{id:string}>(`
    insert into placement_companies(name,created_by_user_id)
    values($1,$2) returning id`,["Round CAS "+suffix,SEED_IDS.facultyUser])).rows;
  const [relationship]=(await pool.query<{id:string}>(`
    insert into placement_company_relationships(college_id,company_id,created_by_user_id)
    values($1,$2,$3) returning id`,[SEED_IDS.collegeA,company!.id,SEED_IDS.facultyUser])).rows;
  const [job]=(await pool.query<{id:string}>(`
    insert into placement_jobs
      (college_id,season_id,company_relationship_id,title,description,
       employment_type,work_mode,application_mode,minimum_annual_ctc_inr,
       application_deadline,status,published_at,created_by_user_id)
    values ($1,$2,$3,$4,'Round action concurrency fixture','FULL_TIME','REMOTE',
       'INTERNAL',800000,'2099-10-01T00:00:00Z','PUBLISHED',now(),$5) returning id`,
    [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,relationship!.id,"Round "+suffix,SEED_IDS.facultyUser])).rows;
  const [round]=(await pool.query<{id:string}>(`
    insert into placement_job_rounds
      (job_id,sequence,kind,name,duration_minutes,created_by_user_id)
    values ($1,1,'INTERVIEW','Interview',45,$2) returning id`,
    [job!.id,SEED_IDS.facultyUser])).rows;
  const fixture={companyId:company!.id,relationshipId:relationship!.id,jobId:job!.id,roundId:round!.id};
  fixtures.push(fixture);
  return fixture;
}

describe.skipIf(!enabled)("chat-2 round actions: real PostgreSQL version and permission boundaries", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Requires disposable PostgreSQL");
    const result=await pool.query<{id:string}>(`
      insert into membership_roles(membership_id,role)
      values ($1,'TPO') on conflict do nothing returning id`,
      [SEED_IDS.facultyCollegeAMembership]);
    grantedRoleId=result.rows[0]?.id;
  });
  afterAll(async () => {
    if (pool) {
      for (const fixture of fixtures) {
        await pool.query("delete from placement_job_round_events where round_id=$1",[fixture.roundId]);
        await pool.query("delete from placement_job_rounds where id=$1",[fixture.roundId]);
        await pool.query("delete from placement_jobs where id=$1",[fixture.jobId]);
        await pool.query("delete from placement_company_relationships where id=$1",[fixture.relationshipId]);
        await pool.query("delete from placement_companies where id=$1",[fixture.companyId]);
      }
      if (grantedRoleId) await pool.query("delete from membership_roles where id=$1",[grantedRoleId]);
      await pool.end();
    }
    await closeDatabaseConnection();
  });

  it("TPO-round-action-05 rejects stale COMPLETE and CANCEL even after a same-status reschedule", async () => {
    if (!pool) throw new Error("Requires disposable PostgreSQL");
    const fixture=await createRoundFixture();
    const scheduled=await actOnPlacementRound(actor,fixture.roundId,{
      action:"SCHEDULE",scheduledAt:new Date("2099-09-20T04:30:00Z"),
      timezone:"Asia/Kolkata",mode:"VIRTUAL",meetingUrl:"https://meet.example.test/initial",
    });
    const current=await actOnPlacementRound(actor,fixture.roundId,{
      action:"SCHEDULE",scheduledAt:new Date("2099-09-21T04:30:00Z"),
      timezone:"Asia/Kolkata",mode:"VIRTUAL",meetingUrl:"https://meet.example.test/new",
    },scheduled.updatedAt.toISOString());
    expect(current.updatedAt.getTime()).toBeGreaterThan(scheduled.updatedAt.getTime());
    await expect(actOnPlacementRound(actor,fixture.roundId,{action:"COMPLETE"},
      scheduled.updatedAt.toISOString())).rejects.toMatchObject({code:"PLACEMENT_ROUND_INVALID_TRANSITION"});
    await expect(actOnPlacementRound(actor,fixture.roundId,{action:"CANCEL",reason:"Applicant schedule changed"},
      scheduled.updatedAt.toISOString())).rejects.toMatchObject({code:"PLACEMENT_ROUND_INVALID_TRANSITION"});
    const afterDenials=await getPlacementRound(actor,fixture.roundId);
    expect(afterDenials.round.status).toBe("SCHEDULED");
    expect(afterDenials.round.scheduledAt?.toISOString()).toBe("2099-09-21T04:30:00.000Z");
    expect(afterDenials.events.map(row=>row.eventType)).toEqual(["SCHEDULED","RESCHEDULED"]);
    const completed=await actOnPlacementRound(actor,fixture.roundId,{
      action:"COMPLETE",
    },current.updatedAt.toISOString());
    expect(completed.status).toBe("COMPLETED");
    expect(completed.updatedAt.getTime()).toBeGreaterThan(current.updatedAt.getTime());
    const events=await pool.query<{total:number}>(`
      select count(*)::integer as total from activity_events
      where subject_id=$1 and event_type='PLACEMENTS_ROUND_COMPLETED'`,[fixture.roundId]);
    expect(events.rows[0]?.total).toBe(1);
    await expect(actOnPlacementRound(actor,fixture.roundId,{action:"COMPLETE"},
      current.updatedAt.toISOString())).rejects.toMatchObject({code:"PLACEMENT_ROUND_INVALID_TRANSITION"});
  });

  it("TPO-round-action-06 denies foreign actors and closed jobs before modifying rounds or recording events", async () => {
    if (!pool) throw new Error("Requires disposable PostgreSQL");
    const fixture=await createRoundFixture();
    await expect(actOnPlacementRound(otherCollege,fixture.roundId,{
      action:"CANCEL",reason:"Other college tried to cancel",
    })).rejects.toThrow();
    const before=await getPlacementRound(actor,fixture.roundId);
    expect(before.round.status).toBe("PENDING");
    await pool.query("update placement_jobs set status='CLOSED' where id=$1",[fixture.jobId]);
    await expect(actOnPlacementRound(actor,fixture.roundId,{
      action:"CANCEL",reason:"Closed job must refuse",
    })).rejects.toMatchObject({code:"PLACEMENT_ROUND_JOB_READ_ONLY"});
    await expect(updatePlacementRound(actor,fixture.roundId,{
      name:"Cannot edit closed drive",
    })).rejects.toMatchObject({code:"PLACEMENT_ROUND_JOB_READ_ONLY"});
    const state=await pool.query<{status:string}>(`
      select status from placement_job_rounds where id=$1`,[fixture.roundId]);
    expect(state.rows[0]?.status).toBe("PENDING");
    const events=await pool.query<{total:number}>(`
      select count(*)::integer as total from placement_job_round_events where round_id=$1`,
      [fixture.roundId]);
    expect(events.rows[0]?.total).toBe(0);
  });
});
