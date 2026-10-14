import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getOwnFacultyTeachingSection } from "@/modules/courses/faculty-profile-teaching-service";
import { getMentorProjectActivityHistory } from "@/modules/projects/mentor-project-activity-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if(!process.env.TEST_DATABASE_URL){
  throw new Error("Faculty/Mentor detail denial tests require disposable TEST_DATABASE_URL");
}
const learner:RequestContext={
  user:{id:SEED_IDS.learnerUser,identityUid:"faculty-mentor-gap-learner",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
const faculty:RequestContext={
  user:{id:SEED_IDS.facultyUser,identityUid:"faculty-mentor-gap-faculty",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY"]},
};
afterAll(async()=>{await closeDatabaseConnection();});

describe("Faculty own teaching and Mentor project activity denial paths",()=>{
  it("forbids Learner from Faculty self-profile teaching read",async()=>{
    await expect(getOwnFacultyTeachingSection(learner,{})).rejects.toBeDefined();
  });
  it("rejects disabled Faculty before any profile read",async()=>{
    await expect(getOwnFacultyTeachingSection({
      ...faculty,user:{...faculty.user,platformStatus:"DISABLED"},
    },{})).rejects.toBeDefined();
  });
  it("rejects forged college/profile selectors rather than switching tenant",async()=>{
    await expect(getOwnFacultyTeachingSection(faculty,{
      membershipId:SEED_IDS.facultyCollegeBMembership,
    })).rejects.toBeDefined();
    await expect(getOwnFacultyTeachingSection(faculty,{
      collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
  it("rejects mixed Mentor/Faculty self-profile impersonation",async()=>{
    await expect(getOwnFacultyTeachingSection({
      ...faculty,membership:{...faculty.membership!,roles:["FACULTY","MENTOR"]},
    },{})).rejects.toBeDefined();
  });
  it("denies Learner access to project activity and tampered membership roles",async()=>{
    await expect(getMentorProjectActivityHistory(learner,{
      projectId:SEED_IDS.collegeA,
    })).rejects.toBeDefined();
    await expect(getMentorProjectActivityHistory({
      ...learner,membership:{...learner.membership!,roles:["MENTOR"]},
    },{projectId:SEED_IDS.collegeA})).rejects.toBeDefined();
  });
  it("denies out-of-scope project UUID and caller-injected tenant selectors",async()=>{
    await expect(getMentorProjectActivityHistory({
      ...faculty,membership:{...faculty.membership!,roles:["MENTOR"]},
    },{projectId:SEED_IDS.collegeB})).rejects.toBeDefined();
    await expect(getMentorProjectActivityHistory({
      ...faculty,membership:{...faculty.membership!,roles:["MENTOR"]},
    },{projectId:SEED_IDS.collegeA,collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
  });
});
