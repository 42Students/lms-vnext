import {describe,it,expect} from "vitest";
import {ownLearnerSupportRequestList,placementRequestTypeLabel,learnerUnifiedHistoryQuerySchema} from "@/modules/placements/learner-support-request-model";
const rows=[{request:{id:"a",requestType:"APPLICATION_WITHDRAWAL",status:"PENDING",reason:"Need help",requestedAt:new Date(),updatedAt:new Date(),decisionNote:null},
  job:{title:"Drive",id:"job"},roleOption:{title:"Engineer"},company:{name:"Employer"}}];
describe("own persisted placement support history",()=>{
  it("lists real status-filtered personal requests without inventing generic tickets",()=>{
    expect(ownLearnerSupportRequestList(rows,{}).total).toBe(1);
    expect(ownLearnerSupportRequestList(rows,{status:"APPROVED"}).items).toHaveLength(0);
    expect(placementRequestTypeLabel("ROUND_RESCHEDULE")).toContain("reschedule");
  });
  it("rejects forged college/role selectors and unsupported statuses",()=>{
    expect(()=>ownLearnerSupportRequestList(rows,{collegeId:"other"})).toThrow();
    expect(()=>ownLearnerSupportRequestList(rows,{status:["PENDING"]})).toThrow();
    expect(()=>ownLearnerSupportRequestList(rows,{status:"VERIFIED"})).toThrow();
  });
});
describe("server-bounded combined Learner request query",()=>{
  it("accepts last-page requests and rejects huge, foreign and malformed filters",()=>{
    expect(learnerUnifiedHistoryQuerySchema.parse({page:"1000",pageSize:"200"}))
      .toMatchObject({page:1000,pageSize:200,status:"ALL",type:"ALL"});
    expect(()=>learnerUnifiedHistoryQuerySchema.parse({page:1001})).toThrow();
    expect(()=>learnerUnifiedHistoryQuerySchema.parse({pageSize:201})).toThrow();
    expect(()=>learnerUnifiedHistoryQuerySchema.parse({collegeId:"other"})).toThrow();
    expect(()=>learnerUnifiedHistoryQuerySchema.parse({page:"1 OR 1=1"})).toThrow();
  });
});
