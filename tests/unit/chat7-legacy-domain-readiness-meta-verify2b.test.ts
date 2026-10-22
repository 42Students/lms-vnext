import {describe,it,expect} from "vitest";
import {evaluateLegacyDomainLoginReadiness,validateLegacyDomainLoginReadinessResponse} from "@/modules/colleges/legacy-domain-login-readiness";

describe("Legacy domain login DTO mapping",()=>{
 it("keeps domain login blockers separate from advisory operational readiness",()=>{
  const result=evaluateLegacyDomainLoginReadiness({requireVerifiedDomains:true,
   domainTotal:2,domainVerified:1,domainPrimary:1,verifiedPrimaryDomains:0,
   hasLogo:false,departments:0,facultyMemberships:0,enrolledLearners:0});
  expect(result.readyForDomainLogin).toBe(false);
  expect(result.blockers).toContain("NO_VERIFIED_PRIMARY_DOMAIN");
  expect(result.warnings).toEqual(expect.arrayContaining(["MISSING_LOGO","EMPTY_COLLEGE_NO_ACADEMIC_DATA"]));
  expect(result.meta).toMatchObject({requireVerifiedDomains:true,domainTotal:2,domainPrimary:1,domainFactsKnown:true});
  expect(validateLegacyDomainLoginReadinessResponse(result)).toMatchObject({meta:result.meta});
 });
 it("reports missing counts as unknown, not an implicitly ready tenant",()=>{
  const result=evaluateLegacyDomainLoginReadiness({requireVerifiedDomains:false,
   domainTotal:null,domainVerified:0,domainPrimary:0,verifiedPrimaryDomains:0,
   hasLogo:null,departments:null,facultyMemberships:null,enrolledLearners:null});
  expect(result.readyForDomainLogin).toBeNull();
  expect(result.meta.domainFactsKnown).toBe(false);
 });
});
