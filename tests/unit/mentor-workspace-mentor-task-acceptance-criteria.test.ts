import {expect,it} from "vitest";
import {showMentorTaskCriteria} from "@/modules/projects/mentor-workspace-evidence-model";
it("gives assigned Mentors the authored review acceptance criteria, never blank content",()=>{
 expect(showMentorTaskCriteria("MENTOR","Must pass tests")).toBe(true);
 expect(showMentorTaskCriteria("MENTOR","   ")).toBe(false);
 expect(showMentorTaskCriteria("LEARNER","Criteria")).toBe(true);
 expect(showMentorTaskCriteria("ADMIN",null)).toBe(false);
});
