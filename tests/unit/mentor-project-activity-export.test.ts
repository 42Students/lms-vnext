import {describe,expect,it} from "vitest";
import {mentorActivityCsv} from "@/modules/projects/mentor-project-activity-export-model";
describe("Mentor project activity redacted CSV",()=>{
  it("exports only safe projected columns in IST and protects sheet formulas",()=>{
    const csv=mentorActivityCsv([{
      id:"id-1",label:"=Excel formula",importance:"HIGH",
      occurredAt:new Date("2026-10-14T10:00:00.000Z"),
    }],0);
    expect(csv).toContain("'=Excel formula");
    expect(csv).toContain("IST");
    expect(csv).not.toContain("metadata");
    expect(csv).not.toContain("actor_user_id");
  });
  it("explicitly labels capped export truncation",()=>{
    expect(mentorActivityCsv([],4)).toContain("4 additional recorded events");
  });
});
