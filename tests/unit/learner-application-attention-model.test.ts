import {describe,expect,it} from "vitest";
import {learnerApplicationAttention} from "@/modules/placements/learner-application-attention-model";
const row=(id:string,status:string,screening:string)=>({
 applicationId:id,companyName:"Employer",jobTitle:"Developer",
 applicationStatus:status,withdrawnAt:null,screening:{status:screening},
});
describe("persisted learner application attention without fake employer deadlines",()=>{
 it("prioritizes shortlisted before review and links only own IDs",()=>{
  const result=learnerApplicationAttention([
    row("review","SUBMITTED","UNDER_REVIEW"),
    row("short","SUBMITTED","SHORTLISTED"),
    row("done","WITHDRAWN","SHORTLISTED"),
  ]);
  expect(result).toMatchObject({shortlistedCount:1,underReviewCount:1,overflow:0});
  expect(result.rows.map(x=>x.id)).toEqual(["short","review"]);
  expect(result.rows[0]?.href).toContain("applicationId=short");
 });
 it("does not invent an urgent warning for an empty or completed journey",()=>{
  expect(learnerApplicationAttention([]).rows).toEqual([]);
  expect(learnerApplicationAttention([row("rejected","SUBMITTED","REJECTED")]).rows).toEqual([]);
 });
});