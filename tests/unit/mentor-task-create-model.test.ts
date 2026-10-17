import {describe,expect,it} from "vitest";
import {mentorTaskCreateParamsSchema,mentorTaskCreateSchema} from "@/modules/projects/mentor-task-create-model";
const id="00000000-0000-4000-8000-000000000001";
const input={sprintId:id,title:"Review prototype",description:null,
  acceptanceCriteria:null,priority:"HIGH",expectedSprintUpdatedAt:"2026-10-14T09:00:00Z"};
describe("Mentor task creation inputs",()=>{
  it("allows only registered task fields and a sprint optimistic token",()=>{
    expect(mentorTaskCreateSchema.safeParse(input).success).toBe(true);
    for(const injected of [{workloadHours:10},{collegeId:id},{status:"DONE"},{assigneeMembershipId:"not-a-uuid"}]){
      expect(mentorTaskCreateSchema.safeParse({...input,...injected}).success).toBe(false);
    }
    expect(mentorTaskCreateSchema.safeParse({...input,assigneeMembershipId:id}).success).toBe(true);
    expect(mentorTaskCreateParamsSchema.safeParse({projectId:id,collegeId:id}).success).toBe(false);
  });
  it("rejects stale shape, malformed timestamp and empty title",()=>{
    expect(mentorTaskCreateSchema.safeParse({...input,title:""}).success).toBe(false);
    expect(mentorTaskCreateSchema.safeParse({...input,expectedSprintUpdatedAt:"yesterday"}).success).toBe(false);
  });
});
