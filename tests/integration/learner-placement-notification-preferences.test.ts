import { Pool } from "pg";
import { afterAll,afterEach,beforeEach,describe,expect,it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { updateOwnPlacementNotificationPreferences } from "@/modules/placements/learner-placement-notification-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {newLearnerPlacementWriteFixture,seedLearnerPlacementWriteFixture,
  cleanupLearnerPlacementWriteFixture,type LearnerPlacementWriteFixture} from "../support/learner-placement-write-fixture";

if (!process.env.TEST_DATABASE_URL) throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerPlacementWriteFixture;
const initial={notifyMatchingJobs:true,notifyApplicationUpdates:true};
const input={notifyMatchingJobs:false,notifyApplicationUpdates:true,confirmed:true,expected:initial} as const;
beforeEach(async()=>{
  fixture=newLearnerPlacementWriteFixture();
  await seedLearnerPlacementWriteFixture(pool,fixture);
},45000);
afterEach(async()=>{await cleanupLearnerPlacementWriteFixture(pool,fixture);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("own placement notification preferences with optimistic saved choices",()=>{
  it("persists only flags, audits a real change and rejects stale edits without a second audit",async()=>{
    await pool.query("INSERT INTO placement_candidate_preferences(membership_id,preferred_role_titles,preferred_locations,minimum_annual_ctc_inr) VALUES($1,ARRAY['Engineer'],ARRAY['Hyderabad'],800000)",[fixture.ids.membership]);
    expect(await updateOwnPlacementNotificationPreferences(fixture.context,input)).toMatchObject({notifyMatchingJobs:false,changed:true});
    expect(await getCandidatePreferences(fixture.context)).toMatchObject({
      preferredRoleTitles:["Engineer"],preferredLocations:["Hyderabad"],minimumAnnualCtcInr:800000,
      notifyMatchingJobs:false,notifyApplicationUpdates:true,
    });
    await expect(updateOwnPlacementNotificationPreferences(fixture.context,{
      ...input,notifyApplicationUpdates:false,
    })).rejects.toMatchObject({code:"PLACEMENT_NOTIFICATION_PREFERENCES_STALE"});
    expect(await updateOwnPlacementNotificationPreferences(fixture.context,{
      ...input,expected:{notifyMatchingJobs:false,notifyApplicationUpdates:true},
    })).toMatchObject({changed:false});
    const audit=await pool.query("SELECT actor_user_id,actor_membership_id,college_id FROM activity_events WHERE event_type='placements.notification_preferences.updated' AND subject_id=$1",[fixture.ids.membership]);
    expect(audit.rows).toEqual([{actor_user_id:fixture.ids.user,actor_membership_id:fixture.ids.membership,college_id:fixture.ids.college}]);
  },30000);
  it("serializes initial inserts so concurrent tabs cannot both overwrite defaults",async()=>{
    const outcomes=await Promise.allSettled([
      updateOwnPlacementNotificationPreferences(fixture.context,input),
      updateOwnPlacementNotificationPreferences(fixture.context,{...input,notifyMatchingJobs:true,notifyApplicationUpdates:false}),
    ]);
    expect(outcomes.filter(x=>x.status==="fulfilled")).toHaveLength(1);
    expect(outcomes.filter(x=>x.status==="rejected")).toHaveLength(1);
  },30000);
  it("denies foreign college, persisted suspension, wrong role and revoked role without writes",async()=>{
    const context=fixture.context;
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,roles:["TPO"]}},
    ];
    for(const actor of denied)await expect(updateOwnPlacementNotificationPreferences(actor,input)).rejects.toBeDefined();
    await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[fixture.ids.membership]);
    try{await expect(updateOwnPlacementNotificationPreferences(context,input)).rejects.toBeDefined();}
    finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[fixture.ids.membership]);}
    await pool.query("DELETE FROM membership_roles WHERE id=$1",[fixture.ids.role]);
    await expect(updateOwnPlacementNotificationPreferences(context,input)).rejects.toBeDefined();
    const rows=await pool.query("SELECT membership_id FROM placement_candidate_preferences WHERE membership_id=$1",[fixture.ids.membership]);
    expect(rows.rowCount).toBe(0);
    expect((await pool.query("SELECT id FROM activity_events WHERE subject_id=$1",[fixture.ids.membership])).rowCount).toBe(0);
  },30000);
  it("requires expected saved choices and rejects caller scope selectors",async()=>{
    const {expected,...withoutExpected}=input;
    void expected;
    for(const value of [withoutExpected,{...input,collegeId:SEED_IDS.collegeB},{...input,confirmed:false}]) {
      await expect(updateOwnPlacementNotificationPreferences(fixture.context,value)).rejects.toBeDefined();
    }
  });
});
