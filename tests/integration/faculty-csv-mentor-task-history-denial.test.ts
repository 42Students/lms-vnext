import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getFacultyReportCsvForDownload } from "@/modules/courses/faculty-report-csv-service";
import { getMentorTaskReviewHistory } from "@/modules/projects/mentor-task-history-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("CSV GET and Mentor task history tests require disposable TEST_DATABASE_URL");
}
const learner:RequestContext={
  user:{id:SEED_IDS.learnerUser,identityUid:"faculty-mentor-csv-denial",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
const faculty:RequestContext={
  user:{id:SEED_IDS.facultyUser,identityUid:"faculty-mentor-csv-faculty",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
afterAll(async()=>{await closeDatabaseConnection();});
describe("Scoped Faculty GET report and Mentor reviewed task DB denials",()=>{
  it("rejects Learner on either Faculty export kind",async()=>{
    for(const kind of ["quiz","assignment"] as const){
      await expect(getFacultyReportCsvForDownload(learner,{
        kind,assessmentId:SEED_IDS.collegeA,deliveryId:SEED_IDS.collegeA,
      })).rejects.toBeDefined();
    }
  });
  it("rejects disabled or inactive Faculty",async()=>{
    await expect(getFacultyReportCsvForDownload({
      ...faculty,user:{...faculty.user,platformStatus:"DISABLED"},
    },{kind:"quiz",assessmentId:SEED_IDS.collegeA,deliveryId:SEED_IDS.collegeA}))
      .rejects.toBeDefined();
  });
  it("does not authorize another college or arbitrary assessment identifiers",async()=>{
    await expect(getFacultyReportCsvForDownload(faculty,{
      kind:"assignment",assessmentId:SEED_IDS.collegeB,deliveryId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
  it("strictly denies caller-injected college selectors",async()=>{
    await expect(getFacultyReportCsvForDownload(faculty,{
      kind:"quiz",assessmentId:SEED_IDS.collegeA,deliveryId:SEED_IDS.collegeA,
      collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(getMentorTaskReviewHistory(faculty,{
      projectId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
  it("rejects Learner and disabled Mentor access to reviewed task history",async()=>{
    await expect(getMentorTaskReviewHistory(learner,{})).rejects.toBeDefined();
    await expect(getMentorTaskReviewHistory({
      ...faculty,user:{...faculty.user,platformStatus:"DISABLED"},
    },{})).rejects.toBeDefined();
  });
  it("does not accept a forged Mentor context role as an assigned project",async()=>{
    const forged:RequestContext={...learner,membership:{...learner.membership!,roles:["MENTOR"]}};
    const data=await getMentorTaskReviewHistory(forged,{});
    expect(data.items).toEqual([]);
    expect(data.total).toBe(0);
  });
});
