import {describe,expect,it} from "vitest";
import {learnerRequestCancelPayload} from "@/modules/placements/learner-support-cancel-model";
const requestId="81818181-8181-4818-8818-818181818181",token="2026-10-14T12:00:00.000Z";
describe("learner support cancel state and token",()=>{
  it("requires explicit pending confirmation and produces the exact token payload",()=>{
    expect(learnerRequestCancelPayload({requestId,status:"PENDING",confirmed:true,expectedUpdatedAt:token}))
      .toEqual({requestId,action:"CANCEL",expectedUpdatedAt:token});
  });
  it("rejects stale/unconfirmed/forged cancellation commands",()=>{
    for(const bad of [
      {requestId,status:"APPROVED",confirmed:true,expectedUpdatedAt:token},
      {requestId,status:"PENDING",confirmed:false,expectedUpdatedAt:token},
      {requestId,status:"PENDING",confirmed:true,expectedUpdatedAt:"bad"},
      {requestId,status:"PENDING",confirmed:true,expectedUpdatedAt:token,collegeId:"other"},
    ])expect(()=>learnerRequestCancelPayload(bad)).toThrow();
  });
});