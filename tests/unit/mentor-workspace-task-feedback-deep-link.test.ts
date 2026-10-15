import {expect,it} from "vitest";
import {mentorTaskFeedbackHref} from "@/modules/projects/mentor-workspace-evidence-model";
it("links directly to the scoped Mentor task feedback surface",()=>{
 expect(mentorTaskFeedbackHref("project a","task/b"))
  .toBe("/mentor/projects/project%20a/tasks/task%2Fb/feedback");
});
