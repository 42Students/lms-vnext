import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerProfileWithRuntime} from "@/modules/people/runtime";
import {updateOwnLearnerProfileDocument} from "@/modules/people/learner-profile-document-edit-service";
import {emptyLearnerProfileDocument} from "@/modules/people/profile-validation";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerPlacementWriteFixture,seedLearnerPlacementWriteFixture,cleanupLearnerPlacementWriteFixture,type LearnerPlacementWriteFixture} from "../support/learner-placement-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerPlacementWriteFixture;
beforeEach(async()=>{fixture=newLearnerPlacementWriteFixture();await seedLearnerPlacementWriteFixture(pool,fixture);},45000);
afterEach(async()=>{
  await pool.query("DELETE FROM learner_profiles WHERE membership_id=$1",[fixture.ids.membership]);
  await cleanupLearnerPlacementWriteFixture(pool,fixture);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
const initial=emptyLearnerProfileDocument;
const document={...initial,headline:"Updated Engineer",bio:"Private learner biography"};
describe("locked own-profile replacement with audit and stale baseline",()=>{
  it("persists a confirmed real update, rejects stale replay before no-op and records no private values",async()=>{
    const saved=await updateOwnLearnerProfileDocument(fixture.context,{document,expectedDocument:initial});
    expect(saved.profileDocument.headline).toBe(document.headline);
    expect((await getOwnLearnerProfileWithRuntime(fixture.context)).profile.profileDocument.bio).toBe(document.bio);
    await expect(updateOwnLearnerProfileDocument(fixture.context,{document,expectedDocument:initial})).rejects.toMatchObject({code:"LEARNER_PROFILE_DOCUMENT_STALE"});
    await updateOwnLearnerProfileDocument(fixture.context,{document,expectedDocument:document});
    const events=await pool.query("SELECT metadata,actor_user_id FROM activity_events WHERE subject_id=$1 AND event_type='identity.learner_profile_section.updated'",[fixture.ids.membership]);
    expect(events.rowCount).toBe(1);
    expect(events.rows[0].actor_user_id).toBe(fixture.ids.user);
    expect(JSON.stringify(events.rows[0].metadata)).not.toContain(document.bio);
    expect(JSON.stringify(events.rows[0].metadata)).not.toContain(document.headline);
  },30000);
  it("serializes competing first saves and rejects exactly one stale editor",async()=>{
    const outcomes=await Promise.allSettled([
      updateOwnLearnerProfileDocument(fixture.context,{document,expectedDocument:initial}),
      updateOwnLearnerProfileDocument(fixture.context,{document:{...document,headline:"Other editor"},expectedDocument:initial}),
    ]);
    expect(outcomes.filter(x=>x.status==="fulfilled")).toHaveLength(1);
    expect(outcomes.filter(x=>x.status==="rejected")).toHaveLength(1);
  },30000);
  it("denies foreign college, suspended persisted membership and wrong role without writes or audit",async()=>{
    const ctx=fixture.context,input={document,expectedDocument:initial};
    for(const actor of [{...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},{...ctx,membership:{...ctx.membership!,roles:["TPO" as const]}}])
      await expect(updateOwnLearnerProfileDocument(actor,input)).rejects.toMatchObject({name:"AuthorizationError"});
    await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[fixture.ids.membership]);
    await expect(updateOwnLearnerProfileDocument(ctx,input)).rejects.toMatchObject({name:"AuthorizationError"});
    expect((await pool.query("SELECT id FROM activity_events WHERE subject_id=$1",[fixture.ids.membership])).rowCount).toBe(0);
    expect((await pool.query("SELECT membership_id FROM learner_profiles WHERE membership_id=$1",[fixture.ids.membership])).rowCount).toBe(0);
  },30000);
});
