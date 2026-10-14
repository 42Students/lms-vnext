import {describe,expect,it} from "vitest";
import {learnerCourseHasContinueAction} from "@/modules/courses/learner-course-continue-model";
const base={readOnly:false,learningPathReady:true,nextItem:null,nextDue:null};
describe("learner course continue filter",()=>{
  it("includes only active courses with a real persisted next step",()=>{
    expect(learnerCourseHasContinueAction({...base,nextItem:{title:"Lesson"}})).toBe(true);
    expect(learnerCourseHasContinueAction({...base,nextDue:{title:"Quiz"}})).toBe(true);
    expect(learnerCourseHasContinueAction(base)).toBe(false);
  });
  it("never presents historical or unpublished courses as actionable",()=>{
    expect(learnerCourseHasContinueAction({...base,readOnly:true,nextItem:{title:"Lesson"}})).toBe(false);
    expect(learnerCourseHasContinueAction({...base,learningPathReady:false,nextDue:{title:"Quiz"}})).toBe(false);
  });
});
