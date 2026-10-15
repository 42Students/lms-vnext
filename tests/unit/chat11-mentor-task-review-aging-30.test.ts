
import {expect,it} from "vitest";
import {mentorTaskReviewAgeBoundary,mentorTaskReviewQuerySchema} from "@/modules/projects/mentor-task-review-model";
it("uses a strict 30-day persisted submission cutoff for overdue reviews",()=>{
 const now=new Date("2026-10-15T00:00:00Z");
 expect(mentorTaskReviewAgeBoundary("OLDER_THAN_30_DAYS",now)).toEqual({
  cutoff:new Date("2026-09-15T00:00:00Z"),older:true,
 });
 expect(mentorTaskReviewAgeBoundary("LAST_7_DAYS",now)?.older).toBe(false);
 expect(mentorTaskReviewAgeBoundary("ALL",now)).toBeNull();
 expect(mentorTaskReviewQuerySchema.parse({age:"OLDER_THAN_30_DAYS"}).age).toBe("OLDER_THAN_30_DAYS");
});
