import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { actOnPlacementOffer } from "@/modules/placements/offer-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { newLearnerCourseWriteFixture, seedLearnerCourseWriteFixture,
  cleanupLearnerCourseWriteFixture, type LearnerCourseWriteFixture } from "../support/learner-course-write-fixture";

if (!process.env.TEST_DATABASE_URL) throw new Error("Disposable TEST_DATABASE_URL is required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
type Owned={actor:LearnerCourseWriteFixture;company:string;relation:string;job:string;role:string;application:string;offer:string};
let fixture:Owned|null=null;
beforeEach(async()=>{
  const actor=newLearnerCourseWriteFixture();
  fixture={actor,company:randomUUID(),relation:randomUUID(),job:randomUUID(),
    role:randomUUID(),application:randomUUID(),offer:randomUUID()};
  const x=fixture;
  await seedLearnerCourseWriteFixture(pool,actor);
  await pool.query(`INSERT INTO module_access_rules(scope_type,scope_id,module,enabled,locked)
    VALUES('MEMBERSHIP',$1,'placements',true,false)`,[actor.ids.membership]);
  await pool.query(`INSERT INTO placement_eligibility_decisions(college_id,scope_type,scope_id,status,decided_by_user_id)
    VALUES($1,'MEMBERSHIP',$2,'ELIGIBLE',$3)`,[SEED_IDS.collegeA,actor.ids.membership,SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)",
    [x.company,"Decision "+x.company,SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)",
    [x.relation,SEED_IDS.collegeA,x.company,SEED_IDS.collegeAdminUser]);
  await pool.query(`INSERT INTO placement_jobs(id,college_id,season_id,company_relationship_id,title,description,
      employment_type,work_mode,status,published_at,created_by_user_id)
      VALUES($1,$2,$3,$4,$5,'Owned learner offer','FULL_TIME','REMOTE','PUBLISHED',now(),$6)`,
    [x.job,SEED_IDS.collegeA,SEED_IDS.placementSeasonA,x.relation,"Decision "+x.job,SEED_IDS.collegeAdminUser]);
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
  }
  await pool.query("DELETE FROM placement_eligibility_decisions WHERE scope_type='MEMBERSHIP' AND scope_id=$1",[x.actor.ids.membership]);
  await pool.query("DELETE FROM module_access_rules WHERE scope_type='MEMBERSHIP' AND scope_id=$1 AND module='placements'",[x.actor.ids.membership]);
  await cleanupLearnerCourseWriteFixture(pool,x.actor);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own learner offer responses on isolated PostgreSQL",()=>{
  it.each(["ACCEPT","DECLINE"] as const)("records %s exactly once, with immutable audit and stale-state denial",async action=>{
    const x=fixture!;
    const input=action==="DECLINE"?{action,reason:"Pursuing studies"}:{action};
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
