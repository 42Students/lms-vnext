
import {expect,it} from "vitest";
import {mentorProjectActivityQuerySchema,mentorProjectActivitySince} from "@/modules/projects/mentor-project-activity-model";
it("applies a rolling 90-day stored-instant boundary without losing project scope",()=>{
 const now=new Date("2026-10-15T00:00:00Z");
 expect(mentorProjectActivitySince("LAST_90_DAYS",now)?.toISOString())
  .toBe(new Date(now.getTime()-90*86400000).toISOString());
 expect(mentorProjectActivityQuerySchema.parse({
  projectId:"11111111-1111-4111-8111-111111111111",window:"LAST_90_DAYS",
 }).window).toBe("LAST_90_DAYS");
});
