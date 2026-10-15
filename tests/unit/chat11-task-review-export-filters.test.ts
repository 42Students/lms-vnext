
import {expect,it} from "vitest";
import {mentorTaskReviewExportHref,mentorTaskReviewQuerySchema}
 from "@/modules/projects/mentor-task-review-model";
it("exports the full selected review scope but not the UI pagination cursor",()=>{
 const projectId="11111111-1111-4111-8111-111111111111";
 const url=new URL(mentorTaskReviewExportHref({
  projectId,assignment:"SUPPORTING",version:4,priority:"CRITICAL",
  age:"OLDER_THAN_30_DAYS",order:"OLDEST",search:"capstone",
 }),"https://example.test");
 expect(url.pathname).toBe("/api/mentor/task-reviews/export");
 const parsed=mentorTaskReviewQuerySchema.parse(Object.fromEntries(url.searchParams));
 expect(parsed).toMatchObject({projectId,assignment:"SUPPORTING",version:4,
   priority:"CRITICAL",age:"OLDER_THAN_30_DAYS",order:"OLDEST",search:"capstone"});
 expect(url.searchParams.has("page")).toBe(false);
});
