import {expect,it} from "vitest";
import {mentorProjectActivityEventTypes} from "@/modules/projects/mentor-project-activity-model";
it("shows registered readiness overrides in authorized project lifecycle history",()=>{
 const types=mentorProjectActivityEventTypes("PROJECT");
 expect(types).toContain("projects.readiness.overridden");
 expect(types).toContain("projects.project.completed");
 expect(types).toContain("projects.project.deleted");
});
