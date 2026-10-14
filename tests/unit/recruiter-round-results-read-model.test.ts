import {describe,expect,it} from "vitest";
import {projectRecruiterRoundResults,recruiterResultTableQuerySchema,recruiterResultTableHref} from "@/modules/placements/recruiter-round-results-read-model";
const round={id:"a",name:"Technical",sequence:1,kind:"INTERVIEW",status:"SCHEDULED",
 participants:[
  {applicationId:"1",displayName:"A",result:{status:"STAGED",outcome:"PASS",scorePercent:88,waitlistRank:null}},
  {applicationId:"2",displayName:"B",result:{status:"APPLIED",outcome:"HOLD",scorePercent:null,waitlistRank:2}},
  {applicationId:"3",displayName:null,result:null},
 ]};
describe("Recruiter round result read table",()=>{
 it("keeps staged and applied distinct; filters without leaking hidden fields",()=>{
  const all=projectRecruiterRoundResults([round],"a","ALL");
  expect(all?.counts).toEqual({all:3,recorded:2,unrecorded:1,pass:1,fail:0,hold:1,absent:0});
  expect(projectRecruiterRoundResults([round],"a","PASS")?.rows[0]).toMatchObject({name:"A",status:"STAGED",scorePercent:88});
  expect(projectRecruiterRoundResults([round],"a","UNRECORDED")?.rows.map(x=>x.key)).toEqual(["3"]);
  expect(all?.rows[0]).not.toHaveProperty("internalComment");
  expect(all?.rows[0]).not.toHaveProperty("email");
 });
 it("does not permit forged round selection and validates all query fields",()=>{
  expect(projectRecruiterRoundResults([round],"foreign","ALL")).toBeNull();
  expect(recruiterResultTableQuerySchema.safeParse({jobId:"wrong"}).success).toBe(false);
  expect(recruiterResultTableQuerySchema.safeParse({outcome:"APPROVED"}).success).toBe(false);
  expect(recruiterResultTableQuerySchema.safeParse({companyId:"foreign"}).success).toBe(false);
  expect(recruiterResultTableHref({jobId:"a",roundId:"r",outcome:"PASS"})).toBe("/hr/round-results?jobId=a&roundId=r&outcome=PASS");
 });
});
