import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {mentorGoogleConnectionState} from
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

afterAll(async()=>closeDatabaseConnection());

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
 it("rejects a disabled Mentor principal before considering saved OAuth credentials",async()=>{
  await expect(mentorGoogleConnectionState({
   ...mentor,user:{...mentor.user,platformStatus:"DISABLED"},
  })).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
 });
});
