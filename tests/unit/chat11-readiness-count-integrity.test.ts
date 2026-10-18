import {describe,expect,it} from "vitest";
import {evaluateCollegeReadiness,type CollegeReadinessFacts} from "@/modules/colleges/readiness-model";
import {summarizeTenantSetupReadiness} from "@/modules/colleges/admin-tenant-setup-status";

const complete:CollegeReadinessFacts={
 collegeStatus:"ACTIVE",adminMemberships:1,departments:1,programs:1,cohorts:1,
 enrolledLearners:1,facultyMemberships:1,tpoMemberships:1,
 activePlacementSeasons:1,verifiedPrimaryDomains:1,
};

describe("SA-tenants-modules-READY-04 invalid persisted evidence fails closed",()=>{
 it("accepts all ten checked positive counts but never claims runtime launch approval",()=>{
  const evaluation=evaluateCollegeReadiness(complete);
  expect(evaluation.counts).toEqual({total:10,passed:10,failed:0,unknown:0});
  expect(evaluation.overall).toBe("READY");
  const setup=summarizeTenantSetupReadiness(evaluation);
  expect(setup.label).toBe("Persisted checks pass");
  expect(setup.detail).toContain("Runtime DNS");
 });

 it("treats every malformed persisted count as unknown, not ready",()=>{
  const fields=[
   "adminMemberships","departments","programs","cohorts","enrolledLearners",
   "facultyMemberships","tpoMemberships","activePlacementSeasons","verifiedPrimaryDomains",
  ] as const;
  for(const field of fields){
   for(const invalid of [-1,-10,0.5,Number.NaN,Number.POSITIVE_INFINITY,Number.MAX_SAFE_INTEGER+1]){
    const evaluation=evaluateCollegeReadiness({...complete,[field]:invalid});
    expect(evaluation.overall,field+" "+String(invalid)).toBe("INCOMPLETE");
    expect(evaluation.counts).toMatchObject({unknown:1,passed:9,failed:0});
    expect(evaluation.checks.find(check=>check.id!==undefined&&check.status==="UNKNOWN")?.status)
     .toBe("UNKNOWN");
   }
  }
 });

 it("distinguishes confirmed zero from unavailable or corrupted counts",()=>{
  const fail=evaluateCollegeReadiness({...complete,enrolledLearners:0});
  expect(fail.overall).toBe("NOT_READY");
  expect(fail.checks.find(check=>check.id==="LEARNERS")?.status).toBe("FAIL");
  const unknown=evaluateCollegeReadiness({...complete,enrolledLearners:undefined as unknown as number});
  expect(unknown.overall).toBe("INCOMPLETE");
  expect(unknown.checks.find(check=>check.id==="LEARNERS")?.status).toBe("UNKNOWN");
 });

 it("rejects a partial checklist even when every supplied check passes",()=>{
  for(const total of [1,7,9,11,0,-1,Number.NaN]){
   const summary=summarizeTenantSetupReadiness({
    overall:"READY",counts:{total,passed:total,failed:0,unknown:0},
   });
   expect(summary.label).toBe("Unknown");
  }
 });

 it("rejects inconsistent, fractional and negative aggregate counts",()=>{
  const invalid=[
   {total:10,passed:11,failed:-1,unknown:0},
   {total:10,passed:9.5,failed:0.5,unknown:0},
   {total:10,passed:8,failed:1,unknown:0},
   {total:10,passed:Number.POSITIVE_INFINITY,failed:0,unknown:0},
   {total:10,passed:10,failed:Number.NaN,unknown:0},
  ];
  for(const counts of invalid){
   expect(summarizeTenantSetupReadiness({overall:"READY",counts}).label).toBe("Unknown");
  }
 });

 it("preserves confirmed failures over missing evidence and never mutates the source",()=>{
  const facts={...complete,departments:0,verifiedPrimaryDomains:-3};
  const evaluation=evaluateCollegeReadiness(facts);
  expect(evaluation.overall).toBe("NOT_READY");
  expect(evaluation.counts).toEqual({total:10,passed:8,failed:1,unknown:1});
  expect(summarizeTenantSetupReadiness(evaluation).label).toBe("Not ready");
  expect(facts.departments).toBe(0);
  expect(facts.verifiedPrimaryDomains).toBe(-3);
 });
});
