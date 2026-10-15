
import {expect,it} from "vitest";
import {mentorProjectActivityEventTypes} from "@/modules/projects/mentor-project-activity-model";
it("includes deletion history in the explicitly selected Project lifecycle group",()=>{
 expect(mentorProjectActivityEventTypes("PROJECT")).toContain("projects.project.deleted");
 expect(mentorProjectActivityEventTypes("PROJECT")).not.toContain("projects.delivery.submitted");
});
