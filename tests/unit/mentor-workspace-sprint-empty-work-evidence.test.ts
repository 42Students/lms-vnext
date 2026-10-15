import {expect,it} from "vitest";
import {mentorSprintEmptyWorkNotice} from "@/modules/projects/mentor-workspace-evidence-model";
it("distinguishes empty recorded Sprints without inventing completion",()=>{
 expect(mentorSprintEmptyWorkNotice("ACTIVE",[])).toContain("No tasks");
 expect(mentorSprintEmptyWorkNotice("COMPLETED",[])).toContain("no recorded tasks");
 expect(mentorSprintEmptyWorkNotice("ACTIVE",[{}])).toBeNull();
});
