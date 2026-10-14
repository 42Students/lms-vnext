import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {createCourseDiscussionMessage,listCourseDiscussionMessages}
from "@/modules/courses/discussion-service";
import {shouldSendLearnerDiscussionOnEnter}
from "@/components/courses/learner-discussion-mobile-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,
cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture}
from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let own:LearnerCourseWriteFixture|null=null;
beforeEach(async()=>{own=newLearnerCourseWriteFixture();await seedLearnerCourseWriteFixture(pool,own);},45000);
afterEach(async()=>{const f=own;own=null;if(f)await cleanupLearnerCourseWriteFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L5-012 own mobile classroom discussion on PG",()=>{
it("explicit learner post remains an audited persisted message",async()=>{
const f=own!;
expect(shouldSendLearnerDiscussionOnEnter({key:"Enter",shiftKey:false,
isComposing:false,coarsePointer:true})).toBe(false);
const saved=await createCourseDiscussionMessage(f.context,f.ids.delivery,{messageText:"Mobile class question"});
const result=await listCourseDiscussionMessages(f.context,f.ids.delivery);
expect(result.messages.some(message=>message.id===saved.id)).toBe(true);
const events=await pool.query<{total:string}>(
"SELECT count(*)::text AS total FROM activity_events WHERE subject_id=$1 AND event_type='courses.discussion.posted'",
[saved.id]);
expect(events.rows[0]?.total).toBe("1");
},30000);
it("denies foreign-college, suspended and wrong-role readers",async()=>{
const ctx=own!.context,delivery=own!.ids.delivery;
const denied:RequestContext[]=[
{...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
{...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
{...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
];
for(const actor of denied)await expect(listCourseDiscussionMessages(actor,delivery)).rejects.toBeDefined();
},30000);
});