import {describe,expect,it} from "vitest";
import {learnerCourseHasContinueAction} from "@/modules/courses/learner-course-continue-model";
const base={readOnly:false,learningPathReady:true,nextItem:null,nextDue:null};
describe("learner course continue filter",()=>{
  it("includes only active courses with a next step",()=>{
    expect(learnerCourseHasContinueAction({...base,nextItem:{title:"Lesson"}})).toBe(true);
    expect(learnerCourseHasContinueAction({...base,nextDue:{title:"Quiz"}})).toBe(true);
    expect(learnerCourseHasContinueAction(base)).toBe(false);
  });
  it("keeps overdue-only assignments in the Continue learning filter",()=>{
    expect(learnerCourseHasContinueAction({...base,firstOverdue:{itemId:"assignment"}})).toBe(true);
  });
  it("never presents overdue historical or unpublished courses as actionable",()=>{
    expect(learnerCourseHasContinueAction({...base,readOnly:true,firstOverdue:{itemId:"a"}})).toBe(false);
    expect(learnerCourseHasContinueAction({...base,learningPathReady:false,firstOverdue:{itemId:"a"}})).toBe(false);
  });
});
