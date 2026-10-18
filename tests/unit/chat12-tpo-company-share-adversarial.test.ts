import {describe,expect,it} from "vitest";
import {
 companyShareIssueSchema,companyShareRevokeSchema,companyShareTokenSchema,
 issueCompanyShareToken,hashCompanyShareToken,isCompanyShareLive,companyShareExpiry,
 validCompanyShareAccessCode,hashCompanyShareAccessCode,
} from "@/modules/placements/company-share/token-model";
import {canIssueCompanyApplicantShare,MAX_ACTIVE_COMPANY_APPLICANT_SHARES} from "@/modules/placements/company-share/issue-policy";
import {isShareableJob} from "@/modules/placements/company-share/scope-model";
import {publicApplicantSearchSchema,escapeLiteralApplicantSearch,clampCompanySharePage,companyShareApplicantHref} from "@/modules/placements/company-share/public-filter-model";

const JOB="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const T=new Date("2026-10-18T00:00:00.000Z");
describe("TPO-BREAK-company-share-01 exact tenant, expiry and recipient choice",()=>{
 it("never gives another tenant or a draft/archived drive a shareable state",()=>{
  expect(isShareableJob(JOB,JOB,"PUBLISHED")).toBe(true);
  expect(isShareableJob(JOB,JOB,"CLOSED")).toBe(true);
  expect(isShareableJob(JOB,OTHER,"PUBLISHED")).toBe(false);
  for(const status of ["DRAFT","ARCHIVED","CANCELLED",null]){
   expect(isShareableJob(JOB,JOB,status)).toBe(false);
  }
 });
 it("rejects duplicate applicants, malformed ids, extra keys, oversize selections and expiry",()=>{
  const valid={jobId:JOB,selectedApplicationIds:[JOB,OTHER],expiresInDays:2};
  expect(companyShareIssueSchema.safeParse(valid).success).toBe(true);
  for(const bad of [
   {...valid,jobId:"other-tenant"},
   {...valid,expiresInDays:0},
   {...valid,expiresInDays:91},
   {...valid,selectedApplicationIds:[JOB,JOB]},
   {...valid,selectedApplicationIds:Array(201).fill(JOB)},
   {...valid,collegeId:OTHER},
   {...valid,selectedColumns:["NAME","NAME"]},
  ])expect(companyShareIssueSchema.safeParse(bad).success).toBe(false);
  expect(companyShareRevokeSchema.safeParse({shareId:JOB,jobId:JOB}).success).toBe(true);
  expect(companyShareRevokeSchema.safeParse({shareId:JOB,jobId:JOB,anotherCollege:OTHER}).success).toBe(false);
 });
 it("enforces the active-link cap without off-by-one or nonnumeric bypasses",()=>{
  expect(canIssueCompanyApplicantShare(MAX_ACTIVE_COMPANY_APPLICANT_SHARES-1)).toBe(true);
  for(const count of [-1,10,11,1.2,NaN,Infinity])expect(canIssueCompanyApplicantShare(count)).toBe(false);
 });
 it("issues random one-time tokens but only hashes should be persisted",()=>{
  const first=issueCompanyShareToken(),second=issueCompanyShareToken();
  expect(companyShareTokenSchema.safeParse(first.token).success).toBe(true);
  expect(first.digest).toBe(hashCompanyShareToken(first.token));
  expect(first.digest).toMatch(/^[a-f0-9]{64}$/);
  expect(first.digest).not.toEqual(first.token);
  expect(first.token).not.toEqual(second.token);
 });
 it("expires at the boundary, handles revocation and refuses time corruption",()=>{
  const end=companyShareExpiry(T,2);
  expect(isCompanyShareLive({expiresAt:end,revokedAt:null},new Date(end.getTime()-1))).toBe(true);
  expect(isCompanyShareLive({expiresAt:end,revokedAt:null},end)).toBe(false);
  expect(isCompanyShareLive({expiresAt:end,revokedAt:T},T)).toBe(false);
  expect(isCompanyShareLive({expiresAt:new Date(NaN),revokedAt:null},T)).toBe(false);
  expect(isCompanyShareLive({expiresAt:end,revokedAt:null},new Date(NaN))).toBe(false);
 });
 it("denies bad public challenge salt rather than crashing a code-attempt request",()=>{
  const salt="a".repeat(32);
  const hashed=hashCompanyShareAccessCode("123456",salt);
  expect(validCompanyShareAccessCode("123456",salt,hashed)).toBe(true);
  expect(validCompanyShareAccessCode("123457",salt,hashed)).toBe(false);
  expect(validCompanyShareAccessCode("123456","bad-salt",hashed)).toBe(false);
  expect(validCompanyShareAccessCode("javascript:alert(1)",salt,hashed)).toBe(false);
  expect(validCompanyShareAccessCode("123456",salt,"invalid")).toBe(false);
 });
});
describe("TPO-BREAK-company-share-02 public records search and malformed cursor",()=>{
 it("escapes SQL wildcards, scopes URL encoding, and clamps invalid pages",()=>{
  expect(escapeLiteralApplicantSearch("100%_\\Alice")).toBe("100\\%\\_\\\\Alice");
  expect(publicApplicantSearchSchema.safeParse("x".repeat(81)).success).toBe(false);
  expect(companyShareApplicantHref("test-token",2,"A & B")).toBe("/company-share/test-token?page=2&q=A+%26+B");
  expect(clampCompanySharePage(500,26)).toEqual({page:2,totalPages:2});
  for(const bad of [NaN,Infinity,-Infinity,1.5]){
   expect(clampCompanySharePage(bad,26)).toEqual({page:1,totalPages:2});
  }
  expect(clampCompanySharePage(0,0)).toEqual({page:1,totalPages:1});
 });
});
