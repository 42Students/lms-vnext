import {describe,expect,it} from "vitest";
import {learnerAssignmentMobileState} from "@/modules/courses/learner-assignment-mobile-model";
const now=Date.parse("2026-10-14T12:00:00Z");
describe("learner assignment mobile quick state",()=>{
  it("shows real deadline urgency before submission, not invented failure",()=>{
    expect(learnerAssignmentMobileState({submissionId:null,gradePublished:false,
      submittedAt:null,dueAt:"2026-10-14T13:00:00Z"},now).label).toBe("Due within 24 hours");
    expect(learnerAssignmentMobileState({submissionId:null,gradePublished:false,
      submittedAt:null,dueAt:"2026-10-13T13:00:00Z"},now))
      .toMatchObject({label:"Past due",urgent:true});
  });
  it("hides scores when grading has not been published",()=>{
    expect(learnerAssignmentMobileState({submissionId:"own",gradePublished:false,
      submittedAt:"2026-10-13T10:00:00Z",dueAt:null},now))
      .toMatchObject({label:"Submitted",urgent:false});
    expect(learnerAssignmentMobileState({submissionId:"own",gradePublished:true,
      submittedAt:"2026-10-13T10:00:00Z",dueAt:null},now).label).toBe("Grade published");
  });
});
