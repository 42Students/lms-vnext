import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerAssessmentBrowse} from "@/modules/placements/learner-assessment-browse-service";
import {learnerAssessmentDueBuckets,filterLearnerAssessmentDueBucket}
  from "@/modules/placements/learner-assessment-due-buckets";
import {browseLearnerCareerRounds,type LearnerRoundBrowseSource,
  type LearnerRoundBrowseFilters} from "@/modules/placements/learner-rounds-browse-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,
  cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture}
  from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerAssessmentBrowseFixture|null=null;
beforeEach(async()=>{fixture=newLearnerAssessmentBrowseFixture();await seedLearnerAssessmentBrowseFixture(pool,fixture);},45000);
afterEach(async()=>{const f=fixture;fixture=null;if(f)await cleanupLearnerAssessmentBrowseFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
const all:LearnerRoundBrowseFilters={search:"",time:"all",urgency:"all",sort:"soonest"};
describe("L15-004 learner assessment urgency from owned migrated rounds",()=>{
  it("classifies persisted schedule in different IST windows, without employer completion",async()=>{
    const f=fixture!;
    const workspace=await getOwnLearnerAssessmentBrowse(f.drive.learner.context);
    const rows=JSON.parse(JSON.stringify(workspace.rounds)) as LearnerRoundBrowseSource[];
    const laterNow=Date.parse("2026-10-10T10:00:00Z");
    const own=browseLearnerCareerRounds(rows,"ASSESSMENT",all,laterNow);
    expect(learnerAssessmentDueBuckets(own,laterNow).later.some(row=>row.roundId===f.roundId)).toBe(true);
    expect(filterLearnerAssessmentDueBucket(own,"later",laterNow).map(row=>row.roundId)).toContain(f.roundId);
    const pastNow=Date.parse("2026-10-20T10:00:00Z");
    expect(learnerAssessmentDueBuckets(own,pastNow).past.some(row=>row.roundId===f.roundId)).toBe(true);
  },30000);
  it("denies forged tenant, suspended and wrong-role account reads",async()=>{
    const ctx=fixture!.drive.learner.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getOwnLearnerAssessmentBrowse(actor)).rejects.toBeDefined();
  },30000);
});
