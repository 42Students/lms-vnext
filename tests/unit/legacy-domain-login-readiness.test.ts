import {describe,expect,it} from "vitest";
import {evaluateLegacyDomainLoginReadiness,type LegacyDomainLoginFacts} from
 "@/modules/colleges/legacy-domain-login-readiness";

const base:LegacyDomainLoginFacts={
 requireVerifiedDomains:true,domainTotal:1,domainVerified:1,
 domainPrimary:1,verifiedPrimaryDomains:1,hasLogo:true,
 departments:1,facultyMemberships:1,enrolledLearners:1,
};
describe("legacy login-domain readiness policy",()=>{
 const cases=[
  {label:"strict verified primary",p:{},ready:true,blocks:[],warn:[]},
  {label:"strict unverified primary",p:{domainVerified:0,verifiedPrimaryDomains:0},
   ready:false,blocks:["NO_VERIFIED_PRIMARY_DOMAIN"],warn:[]},
  {label:"lenient unverified primary",p:{requireVerifiedDomains:false,domainVerified:0,verifiedPrimaryDomains:0},
   ready:true,blocks:[],warn:["NO_VERIFIED_DOMAIN"]},
  {label:"strict secondary only",p:{domainTotal:2,domainVerified:1,domainPrimary:1,verifiedPrimaryDomains:0},
   ready:false,blocks:["NO_VERIFIED_PRIMARY_DOMAIN"],warn:[]},
  {label:"lenient secondary only",p:{requireVerifiedDomains:false,domainTotal:2,
   domainVerified:1,domainPrimary:1,verifiedPrimaryDomains:0},
   ready:true,blocks:[],warn:["PRIMARY_DOMAIN_NOT_VERIFIED"]},
  {label:"none",p:{domainTotal:0,domainVerified:0,domainPrimary:0,verifiedPrimaryDomains:0},
   ready:false,blocks:["NO_DOMAIN"],warn:[]},
  {label:"missing primary",p:{domainPrimary:0,verifiedPrimaryDomains:0},
   ready:false,blocks:["NO_PRIMARY_DOMAIN","NO_VERIFIED_PRIMARY_DOMAIN"],warn:[]},
  {label:"duplicate primary",p:{domainTotal:2,domainVerified:2,domainPrimary:2,verifiedPrimaryDomains:2},
   ready:false,blocks:["MULTIPLE_PRIMARY_DOMAINS"],warn:[]},
  {label:"logo optional",p:{hasLogo:false},ready:true,blocks:[],warn:["MISSING_LOGO"]},
  {label:"academy advisory",p:{facultyMemberships:0},ready:true,blocks:[],
   warn:["EMPTY_COLLEGE_NO_ACADEMIC_DATA"]},
  {label:"missing aggregate unknown",p:{domainTotal:null},ready:null,blocks:[],warn:[]},
  {label:"malformed aggregate unknown",p:{domainVerified:3},ready:null,blocks:[],warn:[]},
 ] as const;
 for(const fixture of cases){
  it(fixture.label,()=>{
   const actual=evaluateLegacyDomainLoginReadiness({...base,...fixture.p});
   expect(actual.readyForDomainLogin).toBe(fixture.ready);
   expect(actual.blockers).toEqual(fixture.blocks);
   expect(actual.warnings).toEqual(fixture.warn);
  });
 }
});
