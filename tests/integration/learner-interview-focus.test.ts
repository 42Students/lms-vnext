import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {learnerInterviewFocusState} from "@/modules/placements/learner-interview-focus-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let own:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{own=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,own);},45000);
afterEach(async()=>{const f=own;own=null;if(f)await cleanupLearnerCareerCalendarFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L16-004 exact persisted own interview focus",()=>{
it("highlights own round and detects filters which hide it",async()=>{
const f=own!;const source=await getLearnerPlacementRequestWorkspace(f.drive.learner.context);
const rows=JSON.parse(JSON.stringify(source.rounds)) as Array<{applicationId:string;roundId:string}>;
const key=f.applicationId+":"+f.roundId;
expect(learnerInterviewFocusState(rows,rows,key)).toEqual({highlightedKey:key,hiddenByFilters:false});
expect(learnerInterviewFocusState(rows,[],key)).toEqual({highlightedKey:key,hiddenByFilters:true});
expect(learnerInterviewFocusState(rows,rows,f.applicationId+":"+SEED_IDS.collegeB).highlightedKey).toBeNull();
},30000);
it("denies forged college, suspended account and wrong role",async()=>{
const ctx=own!.drive.learner.context;const actors:RequestContext[]=[
{...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
{...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
{...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
];
for(const actor of actors)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
},30000);
});