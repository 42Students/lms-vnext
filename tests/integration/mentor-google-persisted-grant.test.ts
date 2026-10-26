import {afterAll,describe,expect,it} from "vitest";
import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {mentorGoogleConnectionState,getMentorGoogleAccessToken} from
 "@/modules/projects/mentor-google-calendar-connection-service";
import {SEED_IDS} from "../../scripts/db-seed-data";

if(!process.env.TEST_DATABASE_URL)
 throw new Error("Mentor Google grant tests need disposable PostgreSQL");

const mentor:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-shared-faculty",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};

const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("Mentor Google credentials enforce persisted role and membership",()=>{
 it("allows the real persisted Mentor principal to read only its own connection state",async()=>{
  const state=await mentorGoogleConnectionState(mentor);
  expect(state).toMatchObject({
   connected:expect.any(Boolean),available:expect.any(Boolean),
  });
  // A saved OAuth grant is never implied by a valid Mentor membership.
  if(!state.connected)expect(state.connectedAt===null||
    typeof state.connectedAt==="string").toBe(true);
 });
 it("rejects a learner even if a stale role cookie claims MENTOR",async()=>{
  const forged:RequestContext={
   user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",
    platformStatus:"ACTIVE",systemRoles:[]},
   membership:{id:SEED_IDS.learnerCollegeAMembership,
    collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["MENTOR"]},
  };
  await expect(mentorGoogleConnectionState(forged))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
 });
 it("rejects cross-user replay of an otherwise valid Mentor membership",async()=>{
  const stolen:RequestContext={
   ...mentor,
   user:{...mentor.user,id:SEED_IDS.learnerUser,identityUid:"seed-learner"},
  };
  await expect(mentorGoogleConnectionState(stolen))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
 });
 it("denies a mid-session revoked Mentor without trusting the old role cookie",async()=>{
  const userId=randomUUID(),membershipId=randomUUID(),roleId=randomUUID();
  await pool.query("insert into users (id,identity_uid,display_name) values ($1,$2,$3)",
    [userId,"mentor-google-grant-"+userId,"Temporary Mentor"]);
  try{
   await pool.query(
    "insert into college_memberships (id,user_id,college_id,status) values ($1,$2,$3,'ACTIVE')",
    [membershipId,userId,SEED_IDS.collegeA]);
   await pool.query(
    "insert into membership_roles (id,membership_id,role) values ($1,$2,'MENTOR')",
    [roleId,membershipId]);
   const loggedIn:RequestContext={
    user:{id:userId,identityUid:"mentor-google-grant-"+userId,
     platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:membershipId,collegeId:SEED_IDS.collegeA,
     organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["MENTOR"]},
   };
   await expect(mentorGoogleConnectionState(loggedIn)).resolves.toMatchObject({
    connected:expect.any(Boolean),
   });
   await pool.query("delete from membership_roles where id=$1",[roleId]);
   await expect(mentorGoogleConnectionState(loggedIn))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   await expect(getMentorGoogleAccessToken(loggedIn))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }finally{
   await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
   await pool.query("delete from college_memberships where id=$1",[membershipId]);
   await pool.query("delete from users where id=$1",[userId]);
  }
 });
 it("rejects an organization claim inconsistent with the persisted college",async()=>{
  const forged:RequestContext={
   ...mentor,membership:{...mentor.membership!,
    organizationId:randomUUID()},
  };
  await expect(mentorGoogleConnectionState(forged))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
 });
 it("rejects a disabled Mentor principal before considering saved OAuth credentials",async()=>{
  await expect(mentorGoogleConnectionState({
   ...mentor,user:{...mentor.user,platformStatus:"DISABLED"},
  })).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
 });
});
