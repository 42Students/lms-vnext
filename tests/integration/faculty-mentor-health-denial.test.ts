import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getFacultyCourseAssessmentHealth } from "@/modules/courses/faculty-course-health-service";
import { getMentorTeamCoverage } from "@/modules/projects/mentor-team-coverage-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Faculty/Mentor scoped read tests require disposable TEST_DATABASE_URL");
}

const learner: RequestContext = {
  user: {
    id:SEED_IDS.learnerUser,identityUid:"read-health-learner",
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
    id:SEED_IDS.facultyUser,identityUid:"read-health-faculty",
    platformStatus:"ACTIVE",systemRoles:[],
  },
  membership: {
    id:SEED_IDS.facultyCollegeAMembership,
    collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["FACULTY","MENTOR"],
  },
};
afterAll(async()=>{await closeDatabaseConnection();});

describe("Mentor team coverage and Faculty Section health PostgreSQL denials",()=> {
  it("rejects a Learner account from both readers",async()=> {
    await expect(getMentorTeamCoverage(learner,{})).rejects.toBeDefined();
    await expect(getFacultyCourseAssessmentHealth(learner,{
      deliveryId:SEED_IDS.collegeA,
    })).rejects.toBeDefined();
  });
  it("rejects a disabled Mentor/Faculty, despite claimed role",async()=> {
    const disabled: RequestContext = {
      ...faculty,user:{...faculty.user,platformStatus:"DISABLED"},
    };
    await expect(getMentorTeamCoverage(disabled,{})).rejects.toBeDefined();
    await expect(getFacultyCourseAssessmentHealth(disabled,{
      deliveryId:SEED_IDS.collegeA,
    })).rejects.toBeDefined();
  });
  it("rejects forged project/college selector before database discovery",async()=> {
    await expect(getMentorTeamCoverage(faculty,{
      projectId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(getFacultyCourseAssessmentHealth(faculty,{
      deliveryId:SEED_IDS.collegeA,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
  it("does not elevate a Learner simply by forging a Mentor role",async()=> {
    const forged: RequestContext = {
      ...learner,membership:{...learner.membership!,roles:["MENTOR"]},
    };
    const data=await getMentorTeamCoverage(forged,{});
    expect(data.items).toEqual([]);
    expect(data.total).toBe(0);
  });
  it("rejects a valid Faculty principal requesting an unauthorized delivery",async()=> {
    await expect(getFacultyCourseAssessmentHealth(faculty,{
      deliveryId:SEED_IDS.collegeA,
    })).rejects.toBeDefined();
  });
});
