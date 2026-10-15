
import {expect,it} from "vitest";
import {mentorProjectActivityQuerySchema,mentorProjectActivitySince} from "@/modules/projects/mentor-project-activity-model";
it("validates the historical exact-project filter and keeps an exact cutoff",()=>{
 const now=new Date("2026-10-15T00:00:00Z");
 const limit=mentorProjectActivitySince("OLDER_THAN_30_DAYS",now);
 expect(limit?.toISOString()).toBe(new Date(now.getTime()-30*86400000).toISOString());
 expect(mentorProjectActivityQuerySchema.parse({
  projectId:"11111111-1111-4111-8111-111111111111",
  window:"OLDER_THAN_30_DAYS",
 }).window).toBe("OLDER_THAN_30_DAYS");
});
