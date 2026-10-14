import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerAssessmentBrowse} from "@/modules/placements/learner-assessment-browse-service";
import {learnerAssessmentMissingSchedule} from "@/modules/placements/learner-assessment-missing-schedule-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture} from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerAssessmentBrowseFixture;
beforeEach(async()=>{f=newLearnerAssessmentBrowseFixture();await seedLearnerAssessmentBrowseFixture(pool,f);},45000);
afterEach(async()=>{await cleanupLearnerAssessmentBrowseFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("unknown provider deadline against persisted authorized TEST rounds",()=>{
 it("separates missing college time from a valid own saved schedule",async()=>{
  const rounds=(await getOwnLearnerAssessmentBrowse(f.drive.learner.context)).rounds.map(row=>({
   ...row,scheduledAt:row.scheduledAt?.toISOString()??null,
   exception:row.exception?{scheduledAt:row.exception.scheduledAt.toISOString()}:null,
  }));
  const selected=rounds.filter(row=>row.roundId===f.roundId);
  expect(learnerAssessmentMissingSchedule(selected).count).toBe(0);
  // The fixture's scheduled round remains unchanged: setting SCHEDULED to
  // NULL would violate producer invariants and is unit-tested separately.
  expect(learnerAssessmentMissingSchedule([{...selected[0]!,scheduledAt:null}]).count).toBe(1);
 },30000);
 it("denies foreign college, wrong role and persisted suspension",async()=>{
  const ctx=f.drive.learner.context;
  await expect(getOwnLearnerAssessmentBrowse({...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}})).rejects.toBeDefined();
  await expect(getOwnLearnerAssessmentBrowse({...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}})).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[f.drive.learner.ids.membership]);
  try{await expect(getOwnLearnerAssessmentBrowse(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[f.drive.learner.ids.membership]);}
 },30000);
});
