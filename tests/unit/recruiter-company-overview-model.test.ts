import {describe,expect,it} from "vitest";
import {buildRecruiterCompanyOverview,recruiterCompanyOverviewQuerySchema} from "@/modules/placements/recruiter-company-overview-model";
const base={collegeId:"college-a",relationshipId:"rel-a",job:{id:"a",title:"Developer",status:"PUBLISHED",archivedAt:null}};
describe("HR company profile hiring footprint",()=>{
 it("only counts published jobs at the exact relationship",()=>{
  const rows=[base,{...base,job:{...base.job,id:"b",status:"CLOSED"}},
   {...base,relationshipId:"rel-b",job:{...base.job,id:"foreign"}},
   {...base,collegeId:"college-b",job:{...base.job,id:"another"}},
   {...base,job:{...base.job,id:"hidden",status:"DRAFT"}},
   {...base,job:{...base.job,id:"archived",archivedAt:new Date()}}];
  expect(buildRecruiterCompanyOverview(rows,"college-a","rel-a")).toEqual({
   total:2,active:1,closed:1,recent:[
     {id:"a",title:"Developer",status:"PUBLISHED"},
     {id:"b",title:"Developer",status:"CLOSED"},
   ],
  });
 });
 it("rejects foreign-shaped filter input",()=>{
  expect(recruiterCompanyOverviewQuerySchema.safeParse({collegeId:"bad"}).success).toBe(false);
  expect(recruiterCompanyOverviewQuerySchema.safeParse({companyId:"injected"}).success).toBe(false);
 });
});
