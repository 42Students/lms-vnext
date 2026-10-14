import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getFacultyAssessmentResults } from "@/modules/courses/faculty-results-service";
import { getMentorReviewHistory } from "@/modules/projects/mentor-review-history-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Faculty/Mentor results denial tests require disposable TEST_DATABASE_URL");
}

const learner: RequestContext = {
  user: {
    id:SEED_IDS.learnerUser,identityUid:"read-reports-learner",
    platformStatus:"ACTIVE",systemRoles:[],
  },
  membership: {
    id:SEED_IDS.learnerCollegeAMembership,
    collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["LEARNER"],
  },
};
const faculty: RequestContext = {
  user: {
    id:SEED_IDS.facultyUser,identityUid:"read-reports-faculty",
    platformStatus:"ACTIVE",systemRoles:[],
  },
  membership: {
    id:SEED_IDS.facultyCollegeAMembership,
    collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["FACULTY","MENTOR"],
  },
};

afterAll(async()=>{ await closeDatabaseConnection(); });

describe("Faculty results and Mentor review history DB denial",()=>{
  it("refuses Learner role on both routes", async()=>{
    await expect(getFacultyAssessmentResults(learner,{})).rejects.toBeDefined();
    await expect(getMentorReviewHistory(learner,{})).rejects.toBeDefined();
  });
  it("refuses disabled Faculty/Mentor even if their claimed roles remain",async()=>{
    const disabled:RequestContext={
      ...faculty,user:{...faculty.user,platformStatus:"DISABLED"},
    };
    await expect(getFacultyAssessmentResults(disabled,{})).rejects.toBeDefined();
    await expect(getMentorReviewHistory(disabled,{})).rejects.toBeDefined();
  });
  it("rejects forged college and project parameters before DB discovery",async()=>{
    await expect(getFacultyAssessmentResults(faculty,{
      collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(getMentorReviewHistory(faculty,{
      projectId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
  it("never treats forged Mentor role as a persisted assigned project",async()=>{
    const forged:RequestContext={
      ...learner,
      membership:{...learner.membership!,roles:["MENTOR"]},
    };
    const response=await getMentorReviewHistory(forged,{});
    expect(response.items).toEqual([]);
    expect(response.total).toBe(0);
  });
});
