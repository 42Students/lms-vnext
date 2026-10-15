
import {expect,it} from "vitest";
import {safeMentorProjectEventLabel} from "@/modules/projects/mentor-portfolio-model";
it("keeps project-subject lifecycle labels fixed and separate from private metadata",()=>{
 expect(safeMentorProjectEventLabel("projects.project.created")).toBe("Project created");
 expect(safeMentorProjectEventLabel("projects.delivery.submitted")).toBe("Final delivery submitted");
});
