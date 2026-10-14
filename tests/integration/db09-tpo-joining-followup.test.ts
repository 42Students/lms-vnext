import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoJoiningFollowups} from "@/modules/placements/tpo-joining-followup-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-joining-followup",
platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.facultyCollegeAMembership,
collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;rel?:string;job?:string;role?:string;app?:string;offer?:string}={};const addedTpoRoleIds:string[]=[];
async function fixture(){
 if(!pool)throw Error("isolated DB required");const token=randomUUID();
 ids.company=(await pool.query<{id:string}>("INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",["Join followup "+token,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.rel=(await pool.query<{id:string}>("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",[SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.job=(await pool.query<{id:string}>("INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Followup','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",[SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.rel,"Join followup "+token,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.role=(await pool.query<{id:string}>("INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id",[ids.job])).rows[0]!.id;
 ids.app=(await pool.query<{id:string}>("INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",[ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
 ids.offer=(await pool.query<{id:string}>("INSERT INTO placement_offers(application_id,version,status,role_title,joining_date,issued_by_user_id,responded_by_user_id,responded_at) VALUES($1,1,'ACCEPTED','Main','2026-10-15',$2,$2,now()) RETURNING id",[ids.app,SEED_IDS.facultyUser])).rows[0]!.id;
 return ids.offer!;
}
async function cleanup(){if(!pool)return;
 if(ids.offer)await pool.query("DELETE FROM placement_offers WHERE id=$1",[ids.offer]);
 if(ids.app)await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.app]);
 if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
 if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
 if(ids.rel)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.rel]);
 if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);}
describe.skipIf(!enabled)("TPO joining follow-up PostgreSQL",()=>{
beforeAll(async()=>{
 if(!pool)throw Error("Isolated PostgreSQL required");
 for(const membershipId of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
  const inserted=await pool.query<{id:string}>(
   "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
   [membershipId]);
  if(inserted.rows[0]?.id)addedTpoRoleIds.push(inserted.rows[0].id);
 }
});
afterAll(async()=>{
 await cleanup();
 if(pool)for(const id of addedTpoRoleIds)
  await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
 await pool?.end();
 await closeDatabaseConnection();
});
it("counts a persisted accepted offer and fences foreign-college and wrong role",async()=>{
 const offerId=await fixture();const own=await getTpoJoiningFollowups(tpo,{seasonId:SEED_IDS.placementSeasonA,state:"PENDING"});
 expect(own.rows.find(o=>o.offerId===offerId)?.scheduledDate).toBe("2026-10-15");
 const upcoming=await getTpoJoiningFollowups(tpo,{seasonId:SEED_IDS.placementSeasonA,state:"UPCOMING_7_DAYS"},new Date("2026-10-14T00:00:00Z"));
 expect(upcoming.rows.some(o=>o.offerId===offerId)).toBe(true);
 if(!pool)throw Error("Isolated PostgreSQL required");
 await pool.query("UPDATE placement_offers SET joining_date=NULL WHERE id=$1",[offerId]);
 const unknownDate=await getTpoJoiningFollowups(tpo,{seasonId:SEED_IDS.placementSeasonA,state:"DATE_MISSING"});
 expect(unknownDate.rows.some(o=>o.offerId===offerId)).toBe(true);
 const foreign:RequestContext={...tpo,membership:{...tpo.membership!,id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
 await expect(getTpoJoiningFollowups(foreign,{seasonId:SEED_IDS.placementSeasonA}))
  .rejects.toMatchObject({code:"PLACEMENT_SEASON_NOT_FOUND"});
 const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
 await expect(getTpoJoiningFollowups(wrong,{})).rejects.toBeInstanceOf(AuthorizationError);
});
});
