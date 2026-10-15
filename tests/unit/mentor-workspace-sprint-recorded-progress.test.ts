import {expect,it} from "vitest";
import {mentorSprintTaskFacts} from "@/modules/projects/mentor-workspace-evidence-model";
it("does not claim 100% completed for an empty Sprint",()=>{
 expect(mentorSprintTaskFacts([])).toEqual({total:0,done:0,blocked:0,inReview:0,completionPercent:null});
 expect(mentorSprintTaskFacts([{status:"DONE"},{status:"IN_REVIEW"},{status:"BLOCKED"},{status:"TODO"}]))
  .toEqual({total:4,done:1,inReview:1,blocked:1,completionPercent:25});
});
