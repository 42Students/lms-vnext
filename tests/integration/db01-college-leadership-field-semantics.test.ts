import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {updateCollege} from "@/modules/colleges/service";
import {SEED_IDS} from "../../scripts/db-seed-data";

/** DB-004 normalized source leadership fields:
 * legacy numeric college_chair_id/vice_chair_id are NOT user identities.
 * Current FK authority is a reviewed, active FACULTY membership at this
 * college; same-college and distinct-chair checks must survive to SQL.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
 throw new Error("DB004 college leadership requires a matching disposable PostgreSQL URL");
const pool=new Pool({connectionString:url,max:2});
const admin:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("DB-004 college chair and vice-chair replacement",()=>{
 it("round-trips two valid faculty appointments and rejects wrong-tenant and duplicate members",async()=>{
  const orgId=randomUUID(),collegeId=randomUUID(),users=[randomUUID(),randomUUID()];
  const members=[randomUUID(),randomUUID()];
  let madeOrg=false,madeCollege=false;
  try{
   await pool.query("insert into organizations(id,name,status) values($1,$2,'ACTIVE')",
    [orgId,"DB004 College Leaders "+orgId]);madeOrg=true;
   await pool.query(
    "insert into colleges(id,organization_id,name,code,status) values($1,$2,$3,$4,'ACTIVE')",
    [collegeId,orgId,"DB004 Leadership College","lead-"+collegeId.slice(0,8)]);
   madeCollege=true;
   for(let i=0;i<2;i++){
    await pool.query("insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
     [users[i],"db004-leader-"+users[i]]);
    await pool.query(
     "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
     [members[i],users[i],collegeId]);
    await pool.query("insert into membership_roles(membership_id,role) values($1,'FACULTY')",
     [members[i]]);
   }
   await expect(updateCollege(admin,collegeId,{
    chairMembershipId:SEED_IDS.facultyCollegeAMembership,
   })).rejects.toMatchObject({code:"COLLEGE_APPOINTEE_INVALID"});
   await expect(updateCollege(admin,collegeId,{
    chairMembershipId:members[0],viceChairMembershipId:members[0],
   })).rejects.toMatchObject({code:"COLLEGE_APPOINTEE_INVALID"});
   const updated=await updateCollege(admin,collegeId,{
    chairMembershipId:members[0],viceChairMembershipId:members[1],
   });
   expect(updated).toMatchObject({
    id:collegeId,chairMembershipId:members[0],viceChairMembershipId:members[1],
   });
   const stored=await pool.query<{
    chair_membership_id:string;vice_chair_membership_id:string;
   }>("select chair_membership_id,vice_chair_membership_id from colleges where id=$1",
    [collegeId]);
   expect(stored.rows[0]).toEqual({
    chair_membership_id:members[0],vice_chair_membership_id:members[1],
   });
   await pool.query("update college_memberships set status='SUSPENDED',suspended_at=now() where id=$1",[members[0]]);
   await expect(updateCollege(admin,collegeId,{
    chairMembershipId:members[0],
   })).rejects.toMatchObject({code:"COLLEGE_APPOINTEE_INVALID"});
   const cleared=await updateCollege(admin,collegeId,{
    chairMembershipId:null,viceChairMembershipId:null,
   });
   expect(cleared).toMatchObject({
    chairMembershipId:null,viceChairMembershipId:null,
   });
  }finally{
   if(madeCollege){
    await pool.query(
     "delete from in_app_notifications where event_id in (select id from activity_events where college_id=$1)",
     [collegeId]);
    await pool.query("delete from activity_events where college_id=$1",[collegeId]);
   }
   await pool.query("delete from membership_roles where membership_id=any($1::uuid[])",[members]);
   await pool.query("delete from college_memberships where id=any($1::uuid[])",[members]);
   for(const id of users)await pool.query("delete from users where id=$1",[id]);
   if(madeCollege)await pool.query("delete from colleges where id=$1",[collegeId]);
   if(madeOrg)await pool.query("delete from organizations where id=$1",[orgId]);
  }
 });
});
