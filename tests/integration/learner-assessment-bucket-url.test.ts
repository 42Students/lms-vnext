import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerAssessmentBrowse} from "@/modules/placements/learner-assessment-browse-service";
import {filterLearnerAssessmentDueBucket} from "@/modules/placements/learner-assessment-due-buckets";
import {learnerAssessmentDueHref,readLearnerAssessmentDueFromUrl} from "@/modules/placements/learner-assessment-bucket-url-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture} from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerAssessmentBrowseFixture;
beforeEach(async()=>{f=newLearnerAssessmentBrowseFixture();await seedLearnerAssessmentBrowseFixture(pool,f);},45000);
afterEach(async()=>{await cleanupLearnerAssessmentBrowseFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("authorized learner assessment bucket history",()=>{
 it("filters the persisted test round for a validated Later URL",async()=>{
  const list=(await getOwnLearnerAssessmentBrowse(f.drive.learner.context)).rounds.map(x=>({
   ...x,scheduledAt:x.scheduledAt?.toISOString()??null,
   exception:x.exception?{scheduledAt:x.exception.scheduledAt.toISOString()}:null
  }));
  const url=learnerAssessmentDueHref("/learn/my-placements/assessments","later");
  const bucket=readLearnerAssessmentDueFromUrl(url.split("?")[1]??"");
  expect(filterLearnerAssessmentDueBucket(list,bucket,Date.parse("2026-10-01T00:00:00Z")).map(x=>x.roundId)).toContain(f.roundId);
 },30000);
 it("denies foreign college, role and persisted suspension",async()=>{
  const ctx=f.drive.learner.context;
  await expect(getOwnLearnerAssessmentBrowse({...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}})).rejects.toBeDefined();
  await expect(getOwnLearnerAssessmentBrowse({...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}})).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[f.drive.learner.ids.membership]);
  try{await expect(getOwnLearnerAssessmentBrowse(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[f.drive.learner.ids.membership]);}
 },30000);
});
