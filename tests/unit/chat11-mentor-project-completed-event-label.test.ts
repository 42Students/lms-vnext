
import {expect,it} from "vitest";
import {safeMentorProjectEventLabel} from "@/modules/projects/mentor-portfolio-model";
it("labels completed Project history without copying a learner-authored summary",()=>{
 expect(safeMentorProjectEventLabel("projects.project.completed")).toBe("Project completed");
 expect(safeMentorProjectEventLabel("projects.project.deleted")).toBe("Project deleted");
});
