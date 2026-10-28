import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {legacyRoleAssignmentCandidate} from "@/db/schema/memberships";
import {resolveRequestContext} from "@/modules/identity/context-service";
import {SEED_IDS} from "../../scripts/db-seed-data";

/** Historical role.name is only migration input. Reconcile same-college,
 * active named roles before any role receipt is persisted. A recruiter role
 * must use verified recruiter-profile/grant authority, never a membership
 * role. This does not attest an actual legacy source import or approval. */
const url=process.env.TEST_DATABASE_URL;
if(!url||url!==process.env.DATABASE_URL)
 throw new Error("DB004 role definition witness requires matching disposable PostgreSQL");
const pool=new Pool({connectionString:url,max:2});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("DB-004 source role definition to active typed assignment",()=>{
 it("fail-closes unknown, deleted, wrong-tenant and recruiter role candidates",async()=>{
  const uid=randomUUID(),member=randomUUID(),identityUid="db004-source-role-"+uid;
  const source=(name:string)=>({
   legacyRoleId:401,name,description:"Source-only role label",
   isDeleted:false,membershipCollegeId:SEED_IDS.collegeA,targetCollegeId:SEED_IDS.collegeA,
  });
  expect(legacyRoleAssignmentCandidate(source(" teacher "))).toMatchObject({
   legacyRoleId:401,role:"FACULTY",persistedRoleAuthority:false,
  });
  expect(legacyRoleAssignmentCandidate({...source("teacher"),isDeleted:true})).toBeNull();
  expect(()=>legacyRoleAssignmentCandidate({...source("faculty"),legacyRoleId:0}))
   .toThrow("Legacy role key needs source review");
  expect(()=>legacyRoleAssignmentCandidate({
   ...source("FACULTY"),targetCollegeId:SEED_IDS.collegeB,
  })).toThrow("Legacy role assignment must remain in its college");
  expect(()=>legacyRoleAssignmentCandidate(source("SUPER_ADMIN")))
   .toThrow("Unrecognized old role definition");
  expect(()=>legacyRoleAssignmentCandidate(source("RECRUITER")))
   .toThrow("Recruiter role requires verified company profile");
  expect(()=>legacyRoleAssignmentCandidate(source("unknown-elevated-role")))
   .toThrow("Unrecognized old role definition");
  try{
   await pool.query("insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
    [uid,identityUid]);
   await pool.query("insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [member,uid,SEED_IDS.collegeA]);
   const before=await resolveRequestContext({identityUid,activeMembershipId:member});
   expect(before.membership?.roles).toEqual([]);
   // Source role name and integer ID do not become authority until a new,
   // explicit typed membership role receipt exists on the verified college.
   const accepted=legacyRoleAssignmentCandidate(source("FACULTY"))!;
   expect(accepted.persistedRoleAuthority).toBe(false);
   await pool.query("insert into membership_roles(membership_id,role,legacy_role_id) values($1,$2,$3)",
    [member,accepted.role,accepted.legacyRoleId]);
   const actual=await pool.query<{id:string;role:string;legacy_role_id:number}>(
    "select id,role,legacy_role_id from membership_roles where membership_id=$1",[member]);
   expect(actual.rows).toHaveLength(1);
   expect(actual.rows[0]).toMatchObject({role:"FACULTY",legacy_role_id:401});
   expect(actual.rows[0]?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27,}$/);
   expect(actual.rows[0]?.id).not.toBe("401");
   await expect(resolveRequestContext({
    identityUid,activeMembershipId:member,activeRole:"FACULTY",
   })).resolves.toMatchObject({membership:{roles:["FACULTY"]}});
   // The protected enum cannot store recruiter authority in a college role.
   await expect(pool.query(
    "insert into membership_roles(membership_id,role,legacy_role_id) values($1,'RECRUITER',402)",
    [member])).rejects.toThrow();
   await pool.query("delete from membership_roles where membership_id=$1",[member]);
   await expect(resolveRequestContext({
    identityUid,activeMembershipId:member,activeRole:"FACULTY",
   })).resolves.toMatchObject({membership:{roles:[]}});
  }finally{
   await pool.query("delete from membership_roles where membership_id=$1",[member]);
   await pool.query("delete from college_memberships where id=$1",[member]);
   await pool.query("delete from users where id=$1",[uid]);
  }
 });
});
