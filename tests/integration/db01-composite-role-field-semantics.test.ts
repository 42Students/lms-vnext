import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {resolveRequestContext,listMembershipChoices} from "@/modules/identity/context-service";
import {SEED_IDS} from "../../scripts/db-seed-data";

/** DB-004 composite (NOT source-import) witness:
 * - source learner/faculty organization_id is derived from the verified
 *   college membership's parent organization, never arbitrary user input;
 * - old user.user_type and user_roles foreign keys are replaced by persisted
 *   typed system roles plus college membership-role grants;
 * - active selection and revocation never manufacture missing role authority.
 *
 * This suite does NOT prove historical numeric source-ID migration or owner
 * approval of the source-to-target reconciliation.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
 throw new Error("DB004 composite identity requires isolated registered PostgreSQL");
const pool=new Pool({connectionString:url,max:2});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("DB-004 composite identity and typed-role authority",()=>{
 it("derives organization from actual college ancestry and never from a claimed user type",async()=>{
  const userId=randomUUID(),otherId=randomUUID(),learnerId=randomUUID(),facultyId=randomUUID();
  const identityUid="db004-composite-"+userId;
  try{
   await pool.query("insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
    [userId,identityUid]);
   await pool.query("insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
    [otherId,"db004-composite-other-"+otherId]);
   for(const [membershipId,collegeId,role] of [
    [learnerId,SEED_IDS.collegeA,"LEARNER"],
    [facultyId,SEED_IDS.collegeB,"FACULTY"],
   ]){
    await pool.query("insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
     [membershipId,userId,collegeId]);
    await pool.query("insert into membership_roles(membership_id,role) values($1,$2)",
     [membershipId,role]);
   }
   const ancestry=await pool.query<{membership_id:string;organization_id:string;role:string}>(
    `select m.id as membership_id,c.organization_id,r.role
      from college_memberships m
      join colleges c on c.id=m.college_id
      join membership_roles r on r.membership_id=m.id
     where m.user_id=$1 order by m.id`,[userId]);
   expect(ancestry.rows).toHaveLength(2);
   const choices=await listMembershipChoices(identityUid);
   expect(choices).toEqual(expect.arrayContaining([
    expect.objectContaining({id:learnerId,collegeId:SEED_IDS.collegeA,roles:["LEARNER"]}),
    expect.objectContaining({id:facultyId,collegeId:SEED_IDS.collegeB,roles:["FACULTY"]}),
   ]));
   for(const [membershipId,collegeId,role] of [
    [learnerId,SEED_IDS.collegeA,"LEARNER"],
    [facultyId,SEED_IDS.collegeB,"FACULTY"],
   ] as const){
    const ctx=await resolveRequestContext({
     identityUid,activeMembershipId:membershipId,activeRole:role,
    });
    const persisted=ancestry.rows.find(row=>row.membership_id===membershipId);
    expect(ctx.user.id).toBe(userId);
    expect(ctx.membership).toMatchObject({
     id:membershipId,collegeId,organizationId:persisted?.organization_id,
     roles:[role],status:"ACTIVE",
    });
   }
   // A selected role outside this college is not added to the context by
   // a legacy global user_type or a requested activeRole value.
   const notFaculty=await resolveRequestContext({
    identityUid,activeMembershipId:learnerId,activeRole:"FACULTY",
   });
   expect(notFaculty.membership?.roles).toEqual(["LEARNER"]);
   await expect(resolveRequestContext({
    identityUid:"db004-composite-other-"+otherId,activeMembershipId:learnerId,
   })).rejects.toMatchObject({code:"MEMBERSHIP_NOT_FOUND"});

   const saved=await pool.query<{membership_id:string;role:string;id:string}>(
    "select id,membership_id,role from membership_roles where membership_id=any($1::uuid[])",
    [[learnerId,facultyId]]);
   expect(saved.rows).toHaveLength(2);
   expect(new Set(saved.rows.map(x=>x.role))).toEqual(new Set(["LEARNER","FACULTY"]));
   expect(saved.rows.every(x=>x.id!==learnerId&&x.id!==facultyId)).toBe(true);

   await pool.query("delete from membership_roles where membership_id=$1",[facultyId]);
   const afterRevoke=await resolveRequestContext({
    identityUid,activeMembershipId:facultyId,activeRole:"FACULTY",
   });
   expect(afterRevoke.membership?.roles).toEqual([]);
   const remaining=await resolveRequestContext({
    identityUid,activeMembershipId:learnerId,activeRole:"LEARNER",
   });
   expect(remaining.membership?.roles).toEqual(["LEARNER"]);
   await pool.query("insert into membership_roles(membership_id,role) values($1,'FACULTY')",
    [facultyId]);
   const restored=await resolveRequestContext({
    identityUid,activeMembershipId:facultyId,activeRole:"FACULTY",
   });
   expect(restored.membership?.roles).toEqual(["FACULTY"]);
  }finally{
   await pool.query("delete from membership_roles where membership_id=any($1::uuid[])",
    [[learnerId,facultyId]]);
   await pool.query("delete from college_memberships where id=any($1::uuid[])",
    [[learnerId,facultyId]]);
   await pool.query("delete from users where id=any($1::uuid[])",[[userId,otherId]]);
  }
 });
});
