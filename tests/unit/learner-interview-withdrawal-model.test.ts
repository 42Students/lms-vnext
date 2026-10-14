import {describe,expect,it} from "vitest";
import {learnerInterviewWithdrawalInputSchema,learnerInterviewWithdrawalTarget} from "@/modules/placements/learner-interview-withdrawal-model";
const input={applicationId:"00000000-0000-4000-8000-000000000001",roundId:"00000000-0000-4000-8000-000000000002",expectedUpdatedAt:"2026-10-14T00:00:00.000Z",reason:" Exam conflict ",confirmed:true};
describe("confirmed application withdrawal from an owned interview",()=>{
  it("bounds reason and requires confirmation, persisted IDs and ISO token",()=>{
    expect(learnerInterviewWithdrawalInputSchema.parse(input).reason).toBe("Exam conflict");
    for(const value of [{...input,confirmed:false},{...input,expectedUpdatedAt:undefined},{...input,reason:" x "},{...input,reason:"x".repeat(2001)},{...input,collegeId:"foreign"},{...input,roundId:"unknown"}])
      expect(learnerInterviewWithdrawalInputSchema.safeParse(value).success).toBe(false);
  });
  it("matches the exact owned application and round pair, preserving pending status",()=>{
    const own={applicationId:input.applicationId,roundId:input.roundId,expectedUpdatedAt:input.expectedUpdatedAt,pending:true};
    expect(learnerInterviewWithdrawalTarget([own],input.applicationId,input.roundId)).toEqual(own);
    expect(learnerInterviewWithdrawalTarget([own],input.applicationId,"other")).toBeNull();
    expect(learnerInterviewWithdrawalTarget([own],"other",input.roundId)).toBeNull();
  });
});
