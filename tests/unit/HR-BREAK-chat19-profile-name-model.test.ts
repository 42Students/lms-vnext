import {describe,expect,it} from "vitest";
import {
 hrRecruiterNameFieldsSchema,splitHrRecruiterName,
 joinHrRecruiterName,sameHrNameVersion,
} from "@/modules/placements/hr-recruiter-name-fields-model";

describe("HR-BREAK-PROFILE-NAME-11: employer identity name and optimistic version integrity",()=>{
 it("splits multiple Unicode-space-separated name tokens without losing trailing names",()=>{
  expect(splitHrRecruiterName("  Ananya  Lakshmi Rao  "))
   .toEqual({firstName:"Ananya",lastName:"Lakshmi Rao"});
  expect(splitHrRecruiterName("Ananya\u00a0Rao"))
   .toEqual({firstName:"Ananya",lastName:"Rao"});
  expect(splitHrRecruiterName(null)).toEqual({firstName:"",lastName:""});
 });
 it("canonicalizes only the edited first and last fields, never silently changes user identity",()=>{
  expect(joinHrRecruiterName("  Ananya "," Rao  ")).toBe("Ananya Rao");
  expect(joinHrRecruiterName("Ananya","")).toBe("Ananya");
  expect(hrRecruiterNameFieldsSchema.parse({firstName:" Ananya ",lastName:" Rao "}))
   .toEqual({firstName:"Ananya",lastName:"Rao"});
 });
 it("denies empty, one-character or oversized identities and injected role/company fields",()=>{
  for(const name of [
   {firstName:"",lastName:"Rao"},
   {firstName:"A",lastName:""},
   {firstName:"A".repeat(101),lastName:""},
   {firstName:"A".repeat(100),lastName:"B".repeat(60)},
   {firstName:"Ananya",lastName:"Rao",companyId:"foreign"},
   {firstName:"Ananya",lastName:"Rao",systemRoles:["SUPER_ADMIN"]},
  ]){
   expect(hrRecruiterNameFieldsSchema.safeParse(name).success).toBe(false);
  }
  expect(hrRecruiterNameFieldsSchema.safeParse({
   firstName:"A".repeat(100),lastName:"B".repeat(59),
  }).success).toBe(true);
 });
 it("uses millisecond-equivalent IST/UTC instants for CAS, denies stale and malformed versions",()=>{
  const actual=new Date("2026-10-18T10:00:00.123Z");
  expect(sameHrNameVersion(actual,"2026-10-18T15:30:00.123+05:30")).toBe(true);
  expect(sameHrNameVersion(actual,"2026-10-18T10:00:00.124Z")).toBe(false);
  expect(sameHrNameVersion(actual,"not-a-date")).toBe(false);
  expect(sameHrNameVersion(new Date(Number.NaN),"2026-10-18T10:00:00.123Z")).toBe(false);
 });
});
