import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { actOnPlacementOffer } from "@/modules/placements/offer-service";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { newLearnerPlacementWriteFixture, seedLearnerPlacementWriteFixture,
  cleanupLearnerPlacementWriteFixture, type LearnerPlacementWriteFixture } from "../support/learner-placement-write-fixture";

if (!process.env.TEST_DATABASE_URL) throw new Error("Disposable TEST_DATABASE_URL is required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
type Owned={actor:LearnerPlacementWriteFixture;season:string;company:string;relation:string;job:string;role:string;application:string;offer:string};
let fixture:Owned|null=null;
beforeEach(async()=>{
  const actor=newLearnerPlacementWriteFixture();
  fixture={actor,season:randomUUID(),company:randomUUID(),relation:randomUUID(),job:randomUUID(),
    role:randomUUID(),application:randomUUID(),offer:randomUUID()};
  const x=fixture;
  await seedLearnerPlacementWriteFixture(pool,actor);
  await pool.query("INSERT INTO placement_seasons(id,college_id,name,code,start_date,end_date,created_by_user_id) VALUES($1,$2,$3,$4,'2026-07-01','2027-12-31',$5)",
    [x.season,actor.ids.college,"Offer season "+actor.suffix,"LO-S-"+actor.suffix,SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)",
    [x.company,"Decision "+x.company,SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)",
    [x.relation,actor.ids.college,x.company,SEED_IDS.collegeAdminUser]);
  await pool.query(`INSERT INTO placement_jobs(id,college_id,season_id,company_relationship_id,title,description,
      employment_type,work_mode,status,published_at,created_by_user_id)
      VALUES($1,$2,$3,$4,$5,'Owned learner offer','FULL_TIME','REMOTE','PUBLISHED',now(),$6)`,
    [x.job,actor.ids.college,x.season,x.relation,"Decision "+x.job,SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO placement_job_role_options(id,job_id,title,employment_type,work_mode,is_primary) VALUES($1,$2,$3,'FULL_TIME','REMOTE',true)",
    [x.role,x.job,"Engineer"]);
  await pool.query(`INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,
      eligibility_status,eligibility_snapshot,submitted_by_user_id)
      VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)`,
    [x.application,x.job,x.role,actor.ids.membership,actor.ids.user]);
  await pool.query(`INSERT INTO placement_offers(id,application_id,version,status,role_title,annual_ctc_inr,
      issued_by_user_id,expires_at) VALUES($1,$2,1,'ISSUED','Engineer',1100000,$3,$4)`,
    [x.offer,x.application,SEED_IDS.collegeAdminUser,"2030-11-01T00:00:00Z"]);
},45000);
afterEach(async()=>{
  const x=fixture;fixture=null;if(!x)return;
  // Immutable offer status history and activity events are NEVER deleted.
  // Keep the minimum owning placement hierarchy for an accepted/declined offer.
  const found=await pool.query<{total:string}>(`SELECT count(*)::text AS total FROM placement_offer_status_history WHERE offer_id=$1`,[x.offer]);
  if(found.rows[0]?.total==="0"){
    await pool.query("DELETE FROM placement_offers WHERE id=$1",[x.offer]);
    await pool.query("DELETE FROM placement_applications WHERE id=$1",[x.application]);
    await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[x.role]);
    await pool.query("DELETE FROM placement_jobs WHERE id=$1",[x.job]);
    await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[x.relation]);
    await pool.query("DELETE FROM placement_companies WHERE id=$1",[x.company]);
    await pool.query("DELETE FROM placement_seasons WHERE id=$1",[x.season]);
  }
  await cleanupLearnerPlacementWriteFixture(pool,x.actor);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own learner offer responses on isolated PostgreSQL",()=>{
  it.each(["ACCEPT","DECLINE"] as const)("records %s exactly once, with immutable audit and stale-state denial",async action=>{
    const x=fixture!;
    const input=action==="DECLINE"?{action,reason:"Pursuing studies"}:{action};
    expect((await requireLearnerPlacementAccess(x.actor.context)).id).toBe(x.actor.ids.membership);
    const result=await actOnPlacementOffer(x.actor.context,x.offer,input,new Date("2026-10-14T00:00:00Z"),"ISSUED");
    expect(result.status).toBe(action==="ACCEPT"?"ACCEPTED":"DECLINED");
    await expect(actOnPlacementOffer(x.actor.context,x.offer,input,
      new Date("2026-10-14T00:00:00Z"),"ISSUED")).rejects.toMatchObject({code:"PLACEMENT_OFFER_INVALID_TRANSITION"});
    const history=await pool.query<{total:string}>("SELECT count(*)::text AS total FROM placement_offer_status_history WHERE offer_id=$1",[x.offer]);
    expect(history.rows[0]?.total).toBe("1");
    const events=await pool.query<{total:string}>("SELECT count(*)::text AS total FROM activity_events WHERE subject_id=$1 AND event_type='placements.offer.responded'",[x.offer]);
    expect(events.rows[0]?.total).toBe("1");
  },30000);
  it("denies forged college, suspended, wrong role, swapped actor, and expiry without mutation",async()=>{
    const x=fixture!,context=x.actor.context;
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
      {...context,user:{...context.user,id:SEED_IDS.facultyUser}},
    ];
    for(const actor of denied)await expect(actOnPlacementOffer(actor,x.offer,
      {action:"ACCEPT"},new Date("2026-10-14T00:00:00Z"),"ISSUED")).rejects.toBeDefined();
    await expect(actOnPlacementOffer(context,x.offer,{action:"ACCEPT"},
      new Date("2031-01-01T00:00:00Z"),"ISSUED")).rejects.toMatchObject({code:"PLACEMENT_OFFER_EXPIRED"});
    const row=await pool.query<{status:string}>("SELECT status FROM placement_offers WHERE id=$1",[x.offer]);
    expect(row.rows[0]?.status).toBe("ISSUED");
  },30000);
});
