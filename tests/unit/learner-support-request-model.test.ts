import {describe,it,expect} from "vitest";
import {ownLearnerSupportRequestList,placementRequestTypeLabel} from "@/modules/placements/learner-support-request-model";
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