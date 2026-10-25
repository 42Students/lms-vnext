import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCollegeRoundSlotAppointments, mutateCollegeRoundSlotInterview } from "@/modules/placements/college-round-slot-action-service";
import { finishCollegeInterview } from "@/modules/placements/college-interview-lifecycle-service";
import {mutateCollegeApplicationStages,getCollegeApplicationPipeline} from "@/modules/placements/college-application-stage-service";
import { listCollegeInterviewDirectory } from "@/modules/placements/college-interview-directory-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tag = "CI-" + randomUUID().slice(0, 8);
let fixtureSlotSequence = 0;
const adminA: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "col-pl-int-a", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const adminB: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "col-pl-int-b", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const learner: RequestContext = { ...adminA, membership: { ...adminA.membership!, roles: ["LEARNER"] } };
const ids = { company: randomUUID(), relationship: randomUUID(), season: randomUUID() };

async function makeDrive(status = "PUBLISHED") {
  const p = pool!;
  const job = randomUUID(), role = randomUUID(), app = randomUUID(), round = randomUUID();
  await p.query(
    "INSERT INTO placement_jobs(id,college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,created_by_user_id,status,application_deadline,published_at,closed_at) " +
    "VALUES($1,$2,$3,$4,$5,'fixture','FULL_TIME','HYBRID',$6,$7::varchar,'2099-12-31',now(),CASE WHEN $7::varchar='CLOSED' THEN now() ELSE NULL END)",
    [job, SEED_IDS.collegeA, ids.season, ids.relationship, tag + "-" + job.slice(0, 4), SEED_IDS.collegeAdminUser, status]);
  await p.query("INSERT INTO placement_job_role_options(id,job_id,title,employment_type,work_mode) VALUES($1,$2,$3,'FULL_TIME','HYBRID')", [role, job, tag]);
  await p.query("INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) " +
    "VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
    [app, job, role, SEED_IDS.learnerCollegeAMembership, SEED_IDS.learnerUser]);
  await p.query("INSERT INTO placement_application_screenings(application_id,status,decided_by_user_id,decided_at) VALUES($1,'SHORTLISTED',$2,now()) ON CONFLICT (application_id) DO UPDATE SET status='SHORTLISTED',decided_by_user_id=$2,decided_at=now()", [app, SEED_IDS.collegeAdminUser]);
  await p.query("INSERT INTO placement_job_rounds(id,job_id,sequence,kind,name,created_by_user_id) VALUES($1,$2,1,'INTERVIEW',$3,$4)", [round, job, tag, SEED_IDS.collegeAdminUser]);
  return { job, role, app, round, slotOffsetHours: ++fixtureSlotSequence * 2 };
}
const when = (hours: number) => new Date(Date.now() + hours * 3600_000).toISOString();
const appt = (d: { round: string; app: string; slotOffsetHours?: number }, over: Record<string, unknown> = {}) => ({
  roundId: d.round, applicationId: d.app, scheduledAt: when(48 + (d.slotOffsetHours ?? 0)), durationMinutes: 30,
  interviewType: "TECHNICAL", roundDescription: "Technical interview with the college panel",
  mode: "ON_CAMPUS", venue: "Room 101 " + tag, meetingUrl: null, interviewer: "Dr. Rao", ...over,
});
const schedule = (job: string, d: { round: string; app: string; slotOffsetHours?: number }, over: Record<string, unknown> = {}) =>
  mutateCollegeRoundSlotInterview(adminA, job, { action: "SCHEDULE", confirmed: true, appointment: appt(d, over) });

describe.skipIf(!enabled)("College Admin interviews: isolated PostgreSQL", () => {
  beforeAll(async () => {
    const p = pool!;
    await p.query("INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)", [ids.company, tag, SEED_IDS.collegeAdminUser]);
    await p.query("INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)", [ids.relationship, SEED_IDS.collegeA, ids.company, SEED_IDS.collegeAdminUser]);
    const season = await p.query("SELECT id FROM placement_seasons WHERE college_id=$1 AND status='ACTIVE' LIMIT 1", [SEED_IDS.collegeA]);
    ids.season = season.rows[0]?.id ?? ids.season;
    if (!season.rows[0]) await p.query("INSERT INTO placement_seasons(id,college_id,name,code,start_date,end_date,created_by_user_id,status) VALUES($1,$2,$3,$4,'2026-01-01','2099-12-31',$5,'ACTIVE')", [ids.season, SEED_IDS.collegeA, tag, tag, SEED_IDS.collegeAdminUser]);
  });
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });

  it("COL-placements-01 persists stage transitions and writes immutable history",async()=>{
    const d=await makeDrive();
    const response=await mutateCollegeApplicationStages(adminA,d.job,{
      action:"MOVE",applicationIds:[d.app],stage:"ASSESSMENT",
      reason:"Assessment is scheduled",notifyByEmail:false,confirmed:true,
    });
    expect(response.moved).toBe(1);
    const history=await pool!.query("select to_stage from placement_college_application_stage_history where stage_id in (select id from placement_college_application_stages where application_id=$1)",[d.app]);
    expect(history.rows).toEqual(expect.arrayContaining([expect.objectContaining({to_stage:"ASSESSMENT"})]));
  });

  it("COL-placements-05 filters applications against persisted stage and source",async()=>{
    const d=await makeDrive();
    const command=await mutateCollegeApplicationStages(adminA,d.job,{
      action:"MOVE",applicationIds:[d.app],stage:"ASSESSMENT",
      reason:"Proceeding to assessment",notifyByEmail:false,confirmed:true,
    });
    expect(command.moved).toBe(1);
    const matches=await getCollegeApplicationPipeline(adminA,d.job,{status:"SUBMITTED",stage:"ASSESSMENT",source:"INTERNAL"});
    expect(matches.items.map(row=>row.id)).toContain(d.app);
    const excluded=await getCollegeApplicationPipeline(adminA,d.job,{status:"SUBMITTED",stage:"REJECTED",source:"INTERNAL"});
    expect(excluded.items.map(row=>row.id)).not.toContain(d.app);
  });

  it("COL-placements-04: schedule, edit, complete persist, audit and notify the candidate", async () => {
    const d = await makeDrive();
    const s = await schedule(d.job, d);
    expect(s).toMatchObject({ status: "SCHEDULED", version: 1 });
    const edit = await mutateCollegeRoundSlotInterview(adminA, d.job, {
      action: "EDIT", confirmed: true, interviewId: s.id, expectedVersion: 1,
      appointment: appt(d, { scheduledAt: when(72), durationMinutes: 45 }), reason: "Panel changed" });
    expect(edit).toMatchObject({ status: "SCHEDULED", version: 2 });
    const list = await getCollegeRoundSlotAppointments(adminA, d.job);
    expect(list.interviews).toContainEqual(expect.objectContaining({ id: s.id, status: "SCHEDULED", durationMinutes: 45, mode: "ON_CAMPUS" }));
    expect(list.candidates.map(c => c.applicationId)).toContain(d.app);
    const done = await mutateCollegeRoundSlotInterview(adminA, d.job, { action: "COMPLETED", confirmed: true, interviewId: s.id, expectedVersion: 2, reason: "Interview held" });
    expect(done.status).toBe("COMPLETED");
    expect((await getCollegeRoundSlotAppointments(adminA, d.job)).interviews[0].status).toBe("COMPLETED");
    await expect(mutateCollegeRoundSlotInterview(adminA, d.job, { action: "NO_SHOW", confirmed: true, interviewId: s.id, expectedVersion: 3, reason: "Second outcome" })).rejects.toThrow();
    const events = await pool!.query("SELECT event_type FROM activity_events WHERE subject_id=$1 ORDER BY occurred_at", [s.id]);
    expect(events.rows.map(r => r.event_type)).toEqual(expect.arrayContaining([
      "PLACEMENTS_COLLEGE_INTERVIEW_SCHEDULED", "PLACEMENTS_COLLEGE_INTERVIEW_RESCHEDULED", "PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED"]));
    const notes = await pool!.query("SELECT count(*)::int n FROM in_app_notifications n JOIN activity_events e ON e.id=n.event_id WHERE e.subject_id=$1", [s.id]);
    expect(notes.rows[0].n).toBe(3);
  });

  it("COL-placements-04: cancel frees the candidate slot and a stale version is refused", async () => {
    const d = await makeDrive();
    const s = await schedule(d.job, d);
    await expect(mutateCollegeRoundSlotInterview(adminA, d.job, { action: "CANCEL", confirmed: true, interviewId: s.id, expectedVersion: 7, reason: "Stale cancel" })).rejects.toThrow(/changed/);
    expect((await mutateCollegeRoundSlotInterview(adminA, d.job, { action: "CANCEL", confirmed: true, interviewId: s.id, expectedVersion: 1, reason: "Company asked" })).status).toBe("CANCEL");
    const again = await schedule(d.job, d, { venue: "Room 202 " + tag, interviewer: "Dr. Iyer" });
    expect(again.status).toBe("SCHEDULED");
  });

  it("COL-placements-04: rejects past times, virtual without https, overlapping room, non-shortlisted candidate and closed drive", async () => {
    const d = await makeDrive();
    await expect(schedule(d.job, d, { scheduledAt: when(-5) })).rejects.toThrow();
    await expect(schedule(d.job, d, { mode: "VIRTUAL", venue: null, meetingUrl: "http://insecure.example.com/m" })).rejects.toThrow();
    await expect(schedule(d.job, d, { mode: "ON_CAMPUS", venue: null })).rejects.toThrow();
    await schedule(d.job, d);
    await expect(schedule(d.job, d)).rejects.toThrow(/previous round is still active/);
    await pool!.query("UPDATE placement_application_screenings SET status='SHORTLISTED' WHERE application_id=$1", [d.app]);
    const other = await makeDrive();
    await pool!.query("UPDATE placement_application_screenings SET status='PENDING',decided_by_user_id=NULL,decided_at=NULL WHERE application_id=$1", [other.app]);
    await expect(schedule(other.job, other)).rejects.toThrow(/shortlist/i);
    const closed = await makeDrive("CLOSED");
    await expect(schedule(closed.job, closed)).rejects.toThrow(/open drive/);
  });

  it("COL-placements-04: foreign college and learner cannot schedule or read appointments", async () => {
    const d = await makeDrive();
    await expect(mutateCollegeRoundSlotInterview(adminB, d.job, { action: "SCHEDULE", confirmed: true, appointment: appt(d) })).rejects.toThrow(/not found/i);
    await expect(mutateCollegeRoundSlotInterview(learner, d.job, { action: "SCHEDULE", confirmed: true, appointment: appt(d) })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getCollegeRoundSlotAppointments(adminB, d.job)).rejects.toThrow(/not found/i);
    await expect(mutateCollegeRoundSlotInterview(adminA, d.job, { action: "SCHEDULE", confirmed: false, appointment: appt(d) })).rejects.toThrow();
  });

  it("COL-placements-19: directory lists booked interviews with summary, mode/status/company filters and a student overlap conflict", async () => {
    const d1 = await makeDrive(), d2 = await makeDrive();
    const start = when(96);
    const a = await schedule(d1.job, d1, { scheduledAt: start, venue: "Hall X " + tag, interviewer: "P1" });
    await expect(schedule(d2.job, d2, { scheduledAt: start, mode: "VIRTUAL", venue: null, meetingUrl: "https://meet.example.com/" + tag, interviewer: "P2" })).rejects.toThrow(/overlaps|overlapping/);
    await schedule(d2.job, d2, { scheduledAt: when(102), mode: "VIRTUAL", venue: null, meetingUrl: "https://meet.example.com/" + tag, interviewer: "P2" });
    const dir = await listCollegeInterviewDirectory(adminA, { q: tag });
    expect(dir.summary.scheduled).toBeGreaterThanOrEqual(2);
    expect(dir.rows.find(r => r.id === a.id)?.conflict).toBe(false);
    expect((await listCollegeInterviewDirectory(adminA, { q: tag, mode: "VIRTUAL" })).rows.every(r => r.mode === "VIRTUAL")).toBe(true);
    expect((await listCollegeInterviewDirectory(adminA, { q: tag, companyId: ids.company })).total).toBeGreaterThanOrEqual(2);
    const noShowBefore = (await listCollegeInterviewDirectory(adminA, { q: tag, status: "NO_SHOW" })).total;
    await finishCollegeInterview(adminA, { id: a.id, expectedVersion: 1, status: "NO_SHOW", reason: "Did not attend" });
    expect((await listCollegeInterviewDirectory(adminA, { q: tag, status: "NO_SHOW" })).total).toBe(noShowBefore + 1);
    expect((await listCollegeInterviewDirectory(adminB, { q: tag })).total).toBe(0);
    await expect(listCollegeInterviewDirectory(learner, {})).rejects.toBeInstanceOf(AuthorizationError);
  });
});
