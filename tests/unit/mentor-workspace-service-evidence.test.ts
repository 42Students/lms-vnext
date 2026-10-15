import {expect,it} from "vitest";
import {buildMentorWorkspaceEvidence} from "@/modules/projects/mentor-workspace-evidence-model";
it("derives safe Mentor workspace review and team evidence from already authorized rows",()=>{
 const derived=buildMentorWorkspaceEvidence({
  tasks:[{sprintId:"s1",status:"DONE"},{sprintId:"s1",status:"BLOCKED"},
   {sprintId:"s2",status:"IN_REVIEW"}],
  members:[{role:"LEARNER",isPrimary:false},{role:"MENTOR",isPrimary:true}],
  submissions:[{version:2,status:"APPROVED"},{version:1,status:"SUBMITTED"}],
 });
 expect(derived.tasksBySprint.s1).toMatchObject({total:2,done:1,blocked:1,completionPercent:50});
 expect(derived.tasksBySprint.s2).toMatchObject({total:1,inReview:1,completionPercent:0});
 expect(derived.tasksBySprint.s3).toBeUndefined();
 expect(derived.team).toEqual({learners:1,mentors:1,primaryMentors:1});
 expect(derived.latestDelivery).toEqual({version:2,status:"APPROVED"});
});
