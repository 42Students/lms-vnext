import {describe,expect,it} from "vitest";
import {mentorReviewedTasksCsv} from "@/modules/projects/mentor-task-review-export-model";
describe("Mentor reviewed task CSV privacy",()=>{
  it("exports safe decision metadata and neutralizes spreadsheet formulas",()=>{
    const csv=mentorReviewedTasksCsv([{id:"review-id",projectTitle:"Project",
      taskTitle:"=cmd",version:3,status:"CHANGES_REQUESTED",
      reviewedAt:new Date("2026-10-14T10:00:00.000Z"),
    }],0);
    expect(csv).toContain("'=cmd");
    expect(csv).toContain("Changes requested");
    expect(csv).toContain("IST");
    expect(csv).not.toContain("learner_email");
    expect(csv).not.toContain("feedback");
  });
  it("discloses omitted row count without silently dropping data",()=>{
    expect(mentorReviewedTasksCsv([],17)).toContain("17 additional reviewed versions");
  });
});
