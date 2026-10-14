import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getFacultyResponseFollowUps } from "@/modules/courses/faculty-response-followup-service";
import { getMentorSprintProgress } from "@/modules/projects/mentor-sprint-progress-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Faculty/Mentor read-only denial tests require disposable TEST_DATABASE_URL");
}
const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser, identityUid:"sprint-followup-learner",
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
    id:SEED_IDS.facultyUser,identityUid:"sprint-followup-faculty",
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

describe("Faculty follow-up and Mentor sprint progress DB denial", () => {
  it("rejects Learner accounts on both Faculty/Mentor readers", async () => {
    await expect(getFacultyResponseFollowUps(learner,{})).rejects.toBeDefined();
    await expect(getMentorSprintProgress(learner,{})).rejects.toBeDefined();
  });
  it("rejects disabled Faculty and Mentors", async () => {
    const disabled: RequestContext = {
      ...faculty,
      user: {...faculty.user,platformStatus:"DISABLED"},
    };
    await expect(getFacultyResponseFollowUps(disabled,{})).rejects.toBeDefined();
    await expect(getMentorSprintProgress(disabled,{})).rejects.toBeDefined();
  });
  it("rejects caller-controlled organization and project scopes", async () => {
    await expect(getFacultyResponseFollowUps(faculty,{
      collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(getMentorSprintProgress(faculty,{
      projectId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
  it("does not accept forged Mentor role absent a persisted project grant", async () => {
    const forged: RequestContext = {
      ...learner,
      membership: {...learner.membership!,roles:["MENTOR"]},
    };
    const result = await getMentorSprintProgress(forged,{});
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
  it("does not accept forged Faculty role absent a persisted teaching assignment", async () => {
    const forged: RequestContext = {
      ...learner,
      membership: {...learner.membership!,roles:["FACULTY"]},
    };
    const result = await getFacultyResponseFollowUps(forged,{});
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
