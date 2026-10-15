import {expect,it} from "vitest";
import {mentorWorkspaceMissingPrimaryMentor} from "@/modules/projects/mentor-workspace-evidence-model";
it("flags only real missing live primary role grants, excluding archived projects",()=>{
 expect(mentorWorkspaceMissingPrimaryMentor("ACTIVE",[])).toBe(true);
 expect(mentorWorkspaceMissingPrimaryMentor("ACTIVE",[{role:"MENTOR",isPrimary:true}])).toBe(false);
 expect(mentorWorkspaceMissingPrimaryMentor("ACTIVE",[{role:"LEARNER",isPrimary:true}])).toBe(true);
 expect(mentorWorkspaceMissingPrimaryMentor("ARCHIVED",[])).toBe(false);
});
