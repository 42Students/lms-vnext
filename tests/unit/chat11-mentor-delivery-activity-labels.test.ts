
import {expect,it} from "vitest";
import {safeMentorProjectEventLabel} from "@/modules/projects/mentor-portfolio-model";
it("shows fixed lifecycle labels without exposing learner authored summaries",()=>{
 const scenarios={
  "projects.delivery.draft_created":"Final delivery draft created",
  "projects.delivery.draft_updated":"Final delivery draft updated",
  "projects.delivery.submitted":"Final delivery submitted",
  "projects.delivery.reviewed":"Final delivery review decision recorded",
 };
 for(const [event,expected] of Object.entries(scenarios)){
  expect(safeMentorProjectEventLabel(event)).toBe(expected);
 }
 expect(safeMentorProjectEventLabel("unregistered.secret")).toBe("Project activity recorded");
});
