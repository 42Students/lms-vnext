import {describe,expect,it} from "vitest";
import {allowedMentorTaskTransition,mentorTaskTransitionSchema,mentorTaskTransitionParamsSchema}
  from "@/modules/projects/mentor-task-transition-model";
describe("Mentor Board transitions",()=>{
  it("allows non-review movements only",()=>{
    expect(allowedMentorTaskTransition("TODO","BLOCKED")).toBe(true);
    expect(allowedMentorTaskTransition("IN_PROGRESS","TODO")).toBe(true);
    for(const start of ["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"]){
      expect(allowedMentorTaskTransition(start,"DONE")).toBe(false);
      expect(allowedMentorTaskTransition(start,"IN_REVIEW")).toBe(false);
      expect(allowedMentorTaskTransition(start,start)).toBe(false);
    }
  });
  it("validates mandatory confirmation, ISO token and strict path",()=>{
    const input={status:"BLOCKED",blockerReason:"Waiting for project review",expectedUpdatedAt:"2026-10-14T10:00:00.000Z",confirmed:true};
    expect(mentorTaskTransitionSchema.safeParse(input).success).toBe(true);
    expect(mentorTaskTransitionSchema.safeParse({...input,collegeId:"forged"}).success).toBe(false);
    expect(mentorTaskTransitionSchema.safeParse({...input,confirmed:false}).success).toBe(false);
    expect(mentorTaskTransitionSchema.safeParse({status:"BLOCKED"}).success).toBe(false);
    expect(mentorTaskTransitionSchema.safeParse({...input,blockerReason:""}).success).toBe(false);
    expect(mentorTaskTransitionSchema.safeParse({...input,status:"IN_PROGRESS"}).success).toBe(false);
    expect(mentorTaskTransitionParamsSchema.safeParse({projectId:"invalid",taskId:"invalid"}).success).toBe(false);
  });
});
