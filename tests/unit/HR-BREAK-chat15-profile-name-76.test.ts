import {describe,expect,it} from "vitest";
import {hrRecruiterNameFieldsSchema,splitHrRecruiterName,
 joinHrRecruiterName,sameHrNameVersion}
 from "@/modules/placements/hr-recruiter-name-fields-model";

describe("HR-PROFILE-76 recruiter name editing and stale identity forms",()=>{
 it("rejects internal CRLF, tabs and control characters in recruiter display names",()=>{
  for(const bad of ["Alice\nAdmin","Alice\rAdmin","Alice\tAdmin","Alice\u0000Admin"]){
   expect(hrRecruiterNameFieldsSchema.safeParse({firstName:bad,lastName:"Smith"}).success)
    .toBe(false);
   expect(hrRecruiterNameFieldsSchema.safeParse({firstName:"Alice",lastName:bad}).success)
    .toBe(false);
  }
 });
 it("preserves normal unicode and whitespace-trimmed name fields",()=>{
  expect(joinHrRecruiterName("  Ananya  ","  Rao  ")).toBe("Ananya Rao");
  expect(joinHrRecruiterName("Élodie","")).toBe("Élodie");
  expect(splitHrRecruiterName("  Ananya Rao  ")).toEqual({firstName:"Ananya",lastName:"Rao"});
 });
 it("does not accept unknown server-trusted identity fields from form JSON",()=>{
  expect(hrRecruiterNameFieldsSchema.safeParse({
   firstName:"Ananya",lastName:"Rao",isAdmin:true,
  }).success).toBe(false);
  expect(hrRecruiterNameFieldsSchema.safeParse({firstName:"A",lastName:""}).success)
   .toBe(false);
 });
 it("compares persisted millisecond versions after offset conversion",()=>{
  const current=new Date("2099-01-01T00:00:00.123Z");
  expect(sameHrNameVersion(current,"2099-01-01T05:30:00.123+05:30")).toBe(true);
  expect(sameHrNameVersion(current,"2099-01-01T00:00:00.122Z")).toBe(false);
  expect(sameHrNameVersion(current,"not-a-version")).toBe(false);
 });
});