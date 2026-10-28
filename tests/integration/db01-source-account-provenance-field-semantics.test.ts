import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {resolveRequestContext} from "@/modules/identity/context-service";
import {SEED_IDS} from "../../scripts/db-seed-data";

/** DB-004 historical learner/faculty account row normalization.
 * Old positive integer IDs and timestamps are import provenance bound to a
 * real, role-verified membership and canonical user. Old 'is_deleted' ends
 * the scoped membership, not the shared person's identity.
 * This executes registered PostgreSQL; no actual legacy source dataset,
 * historical transfer validation or owner import approval is certified.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||url!==process.env.DATABASE_URL)
 throw new Error("DB004 source-account provenance requires matching disposable PG");
const pool=new Pool({connectionString:url,max:2});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("DB-004 historical learner/faculty account provenance and lifecycle",()=>{
 it("retains source IDs and clocks as passive provenance while account access follows scoped roles",async()=>{
  const person=randomUUID(),learnerMember=randomUUID(),facultyMember=randomUUID();
  const identityUid="db004-source-provenance-"+person;
  const createdAt=new Date("2021-01-02T03:04:05.000Z");
  const updatedAt=new Date("2023-06-07T08:09:10.000Z");
  const learnerSource=500001+Math.floor(Math.random()*100000);
  const facultySource=700001+Math.floor(Math.random()*100000);
  try{
   await pool.query("insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
    [person,identityUid]);
   for(const [id,collegeId,role] of [
    [learnerMember,SEED_IDS.collegeA,"LEARNER"],
    [facultyMember,SEED_IDS.collegeB,"FACULTY"],
   ]){
    await pool.query(
     "insert into college_memberships(id,user_id,college_id,status,created_at,updated_at) values($1,$2,$3,'ACTIVE',$4,$5)",
     [id,person,collegeId,createdAt,updatedAt]);
    await pool.query("insert into membership_roles(membership_id,role) values($1,$2)",
     [id,role]);
   }
   await pool.query(
    "insert into learner_profiles(membership_id,legacy_learner_id,roll_number,created_at,updated_at) values($1,$2,$3,$4,$5)",
    [learnerMember,learnerSource,"DB004-ROLL-"+person.slice(0,8),createdAt,updatedAt]);
   await pool.query(
    "insert into faculty_profiles(membership_id,legacy_faculty_id,created_at,updated_at) values($1,$2,$3,$4)",
    [facultyMember,facultySource,createdAt,updatedAt]);
   const persisted=await pool.query<{
    kind:string;source_id:number;membership_id:string;user_id:string;college_id:string;
    member_created_at:Date;member_updated_at:Date;
    profile_created_at:Date;profile_updated_at:Date;
   }>(`
    select 'LEARNER' as kind,p.legacy_learner_id as source_id,
      m.id as membership_id,m.user_id,m.college_id,
      m.created_at as member_created_at,m.updated_at as member_updated_at,
      p.created_at as profile_created_at,p.updated_at as profile_updated_at
     from learner_profiles p join college_memberships m on m.id=p.membership_id
    where p.membership_id=$1
    union all
    select 'FACULTY',p.legacy_faculty_id,m.id,m.user_id,m.college_id,
      m.created_at,m.updated_at,p.created_at,p.updated_at
     from faculty_profiles p join college_memberships m on m.id=p.membership_id
    where p.membership_id=$2
   `,[learnerMember,facultyMember]);
   expect(persisted.rows).toHaveLength(2);
   for(const row of persisted.rows){
    const learner=row.kind==="LEARNER";
    expect(row).toMatchObject({
     source_id:learner?learnerSource:facultySource,
     user_id:person,membership_id:learner?learnerMember:facultyMember,
     college_id:learner?SEED_IDS.collegeA:SEED_IDS.collegeB,
    });
    expect(row.member_created_at.getTime()).toBe(createdAt.getTime());
    expect(row.member_updated_at.getTime()).toBe(updatedAt.getTime());
    expect(row.profile_created_at.getTime()).toBe(createdAt.getTime());
    expect(row.profile_updated_at.getTime()).toBe(updatedAt.getTime());
   }
   expect(await resolveRequestContext({
    identityUid,activeMembershipId:learnerMember,activeRole:"LEARNER",
   })).toMatchObject({membership:{roles:["LEARNER"],collegeId:SEED_IDS.collegeA}});
   expect(await resolveRequestContext({
    identityUid,activeMembershipId:facultyMember,activeRole:"FACULTY",
   })).toMatchObject({membership:{roles:["FACULTY"],collegeId:SEED_IDS.collegeB}});
   // The historical row's deletion lifecycle is scoped; it must not
   // delete the common user or the unrelated college's faculty identity.
   await pool.query(
    "update college_memberships set status='ENDED',legacy_removed_at=clock_timestamp(),updated_at=clock_timestamp() where id=$1",
    [learnerMember]);
   const ended=await pool.query<{status:string;legacy_removed_at:Date;updated_at:Date}>(
    "select status,legacy_removed_at,updated_at from college_memberships where id=$1",[learnerMember]);
   expect(ended.rows[0]?.status).toBe("ENDED");
   expect(ended.rows[0]?.legacy_removed_at).toBeInstanceOf(Date);
   expect(ended.rows[0]?.updated_at.getTime()).toBeGreaterThan(updatedAt.getTime());
   await expect(resolveRequestContext({
    identityUid,activeMembershipId:learnerMember,activeRole:"LEARNER",
   })).rejects.toMatchObject({code:"MEMBERSHIP_NOT_ACTIVE"});
   await expect(resolveRequestContext({
    identityUid,activeMembershipId:facultyMember,activeRole:"FACULTY",
   })).resolves.toMatchObject({membership:{roles:["FACULTY"]}});
   // A stale source clock cannot reactivate an ENDED row; database
   // provenance is never an authorization request principal.
   const currentUser=await pool.query<{platform_status:string}>(
    "select platform_status from users where id=$1",[person]);
   expect(currentUser.rows[0]?.platform_status).toBe("ACTIVE");
  }finally{
   await pool.query("delete from learner_profiles where membership_id=$1",[learnerMember]);
   await pool.query("delete from faculty_profiles where membership_id=$1",[facultyMember]);
   await pool.query("delete from membership_roles where membership_id=any($1::uuid[])",
    [[learnerMember,facultyMember]]);
   await pool.query("delete from college_memberships where id=any($1::uuid[])",
    [[learnerMember,facultyMember]]);
   await pool.query("delete from users where id=$1",[person]);
  }
 });
});
