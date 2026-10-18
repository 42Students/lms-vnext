import {describe,expect,it} from "vitest";
import type {RecruiterContext} from "@/modules/identity/context";
import {hrRecruiterNameFieldsSchema,joinHrRecruiterName,splitHrRecruiterName,sameHrNameVersion}
 from "@/modules/placements/hr-recruiter-name-fields-model";
import {recruiterProfileDetailsPatchSchema,hrProfileSaveErrorFeedback} from "@/modules/placements/recruiter-profile-details-model";
import {isExactRecruiterEmployerRow} from "@/modules/placements/recruiter-own-company-policy";
import {buildRecruiterCompanyOverview,recruiterCompanyOverviewQuerySchema}
 from "@/modules/placements/recruiter-company-overview-model";

const college="11111111-1111-4111-8111-111111111111",otherCollege="22222222-2222-4222-8222-222222222222";
const time="2026-10-18T08:30:00.000Z";

describe("HR-BREAK-profile-01: employer profile, grants and wrong-tenant visibility",()=>{
 it("fails closed on malformed phone, stale timestamp, invalid names or injected extra fields",()=>{
  const valid={firstName:"Ananya",lastName:"Rao",title:"Recruiter",phone:"+91 98765 43210",
   expectedUserUpdatedAt:time,expectedProfileUpdatedAt:time};
  expect(recruiterProfileDetailsPatchSchema.safeParse(valid).success).toBe(true);
  for(const bad of [{phone:"98a76543210"},{phone:"123456789"},{phone:"++919876543210"},
   {phone:"1800123456789"},{firstName:" "},{firstName:"A",lastName:""},
   {firstName:"x".repeat(101)},{title:"x".repeat(161)},{expectedUserUpdatedAt:"stale"},
   {expectedProfileUpdatedAt:""},{isAdmin:true}]){
   expect(recruiterProfileDetailsPatchSchema.safeParse({...valid,...bad}).success).toBe(false);
  }
 });
 it("joins trimmed canonical names and checks persistently stored millisecond version",()=>{
  expect(joinHrRecruiterName(" Ananya "," Rao ")).toBe("Ananya Rao");
  expect(splitHrRecruiterName("  Ananya   Srinivas Rao ")).toEqual({
   firstName:"Ananya",lastName:"Srinivas Rao",
  });
  expect(splitHrRecruiterName(null)).toEqual({firstName:"",lastName:""});
  expect(hrRecruiterNameFieldsSchema.safeParse({firstName:"A",lastName:""}).success).toBe(false);
  expect(sameHrNameVersion(new Date(time),time)).toBe(true);
  expect(sameHrNameVersion(new Date(time),"2026-10-18T08:30:00.001Z")).toBe(false);
  expect(sameHrNameVersion(new Date(time),"not-a-date")).toBe(false);
 });
 it("identical college IDs with different company relationships or employer do not widen access",()=>{
  const owner:Pick<RecruiterContext,"companyId"|"grants">={companyId:"firm-a",grants:[{id:"grant-a",organizationId:"org-a",collegeId:college,collegeName:"College A",companyRelationshipId:"rel-a"}]};
  expect(isExactRecruiterEmployerRow(owner,{companyId:"firm-a",collegeId:college,relationshipId:"rel-a"})).toBe(true);
  expect(isExactRecruiterEmployerRow(owner,{companyId:"firm-b",collegeId:college,relationshipId:"rel-a"})).toBe(false);
  expect(isExactRecruiterEmployerRow(owner,{companyId:"firm-a",collegeId:college,relationshipId:"rel-b"})).toBe(false);
  expect(isExactRecruiterEmployerRow(owner,{companyId:"firm-a",collegeId:otherCollege,relationshipId:"rel-a"})).toBe(false);
 });
 it("company overview only counts current authorized unarchived published/closed drives",()=>{
  const row=(id:string,scope:string,rel:string,status:string,archivedAt:Date|null=null)=>({
   collegeId:scope,relationshipId:rel,job:{id,title:id,status,archivedAt},
  });
  const jobs=[
   row("published",college,"rel-a","PUBLISHED"),
   row("closed",college,"rel-a","CLOSED"),
   row("draft",college,"rel-a","DRAFT"),
   row("archived",college,"rel-a","PUBLISHED",new Date()),
   row("other-college",otherCollege,"rel-a","PUBLISHED"),
   row("other-company",college,"rel-b","PUBLISHED"),
  ];
  expect(buildRecruiterCompanyOverview(jobs,college,"rel-a")).toEqual({
   active:1,closed:1,total:2,
   recent:[{id:"published",title:"published",status:"PUBLISHED"},
           {id:"closed",title:"closed",status:"CLOSED"}],
  });
  expect(recruiterCompanyOverviewQuerySchema.safeParse({collegeId:otherCollege}).success).toBe(true);
  expect(recruiterCompanyOverviewQuerySchema.safeParse({collegeId:"not-uuid"}).success).toBe(false);
  expect(recruiterCompanyOverviewQuerySchema.safeParse({admin:true}).success).toBe(false);
 });
 it("HR-BREAK-profile-02 preserves form data and gives clear recovery after stale, expired, revoked or throttled saves",()=>{
  expect(hrProfileSaveErrorFeedback(409)).toContain("Refresh before saving");
  expect(hrProfileSaveErrorFeedback(401)).toContain("Sign in again");
  expect(hrProfileSaveErrorFeedback(403)).toContain("Ask the placement cell");
  expect(hrProfileSaveErrorFeedback(429)).toContain("Try again shortly");
  for(const status of [400,401,403,409,429,500,503]){
   const feedback=hrProfileSaveErrorFeedback(status);
   expect(feedback).toMatch(/edits are still here|changes are still here/i);
   expect(feedback).not.toMatch(/stack|trace|sql|exception|internal server/i);
  }
 });
});