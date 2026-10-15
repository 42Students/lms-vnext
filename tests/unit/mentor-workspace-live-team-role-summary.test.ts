import {expect,it} from "vitest";
import {mentorWorkspaceTeamFacts} from "@/modules/projects/mentor-workspace-evidence-model";
it("counts only actual current role and primary flags supplied by the authorized roster",()=>{
 expect(mentorWorkspaceTeamFacts([])).toEqual({learners:0,mentors:0,primaryMentors:0});
 expect(mentorWorkspaceTeamFacts([
  {role:"LEARNER",isPrimary:false},{role:"MENTOR",isPrimary:true},
  {role:"MENTOR",isPrimary:false},
 ])).toEqual({learners:1,mentors:2,primaryMentors:1});
});
