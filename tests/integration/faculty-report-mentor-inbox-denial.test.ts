import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getMentorPersonalInbox } from "@/modules/activity/mentor-notifications-service";
import {
  getFacultyAssignmentReport, getFacultyQuizReport,
} from "@/modules/courses/faculty-assessment-report-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Mentor inbox/Faculty export denial requires disposable TEST_DATABASE_URL");
}
const learner:RequestContext = {
  user:{
    id:SEED_IDS.learnerUser,identityUid:"mentor-inbox-denial",
    platformStatus:"ACTIVE",systemRoles:[],
  },
  membership:{
    id:SEED_IDS.learnerCollegeAMembership,
    collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["LEARNER"],
  },
};
const faculty:RequestContext = {
  user:{
    id:SEED_IDS.facultyUser,identityUid:"mentor-inbox-faculty",
    platformStatus:"ACTIVE",systemRoles:[],
  },
  membership:{
    id:SEED_IDS.facultyCollegeAMembership,
    collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["FACULTY","MENTOR"],
  },
};
afterAll(async()=>{await closeDatabaseConnection();});

describe("Mentor persisted-inbox and Faculty assessment report DB denials",()=> {
  it("rejects Learner from Mentor inbox before reading private notifications",async()=> {
    await expect(getMentorPersonalInbox(learner,{})).rejects.toBeDefined();
  });
  it("rejects forged Mentor role when real database grant belongs to Learner",async()=> {
    const forged:RequestContext={
      ...learner,membership:{...learner.membership!,roles:["MENTOR"]},
    };
    await expect(getMentorPersonalInbox(forged,{view:"unread"})).rejects.toBeDefined();
  });
  it("rejects disabled Mentor even with a claimed current role",async()=> {
    const disabled:RequestContext={
      ...faculty,user:{...faculty.user,platformStatus:"DISABLED"},
    };
    await expect(getMentorPersonalInbox(disabled,{})).rejects.toBeDefined();
  });
  it("rejects a forged audience/college selector",async()=> {
    await expect(getMentorPersonalInbox(faculty,{
      collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
  it("denies Learner access to existing Faculty report readers used for CSV",async()=> {
    await expect(getFacultyQuizReport(
      learner,SEED_IDS.collegeA,SEED_IDS.collegeA,
    )).rejects.toBeDefined();
    await expect(getFacultyAssignmentReport(
      learner,SEED_IDS.collegeA,SEED_IDS.collegeA,
    )).rejects.toBeDefined();
  });
  it("denies Faculty a nonexistent Section report instead of exporting other data",async()=> {
    await expect(getFacultyQuizReport(
      faculty,SEED_IDS.collegeB,SEED_IDS.collegeB,
    )).rejects.toBeDefined();
    await expect(getFacultyAssignmentReport(
      faculty,SEED_IDS.collegeB,SEED_IDS.collegeB,
    )).rejects.toBeDefined();
  });
});
