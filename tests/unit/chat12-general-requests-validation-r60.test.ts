import {describe,expect,it} from "vitest";
import {tpoGeneralRequestInputSchema,tpoGeneralRequestDecisionSchema,
  tpoGeneralRequestTarget,tpoGeneralRequestPayload} from "@/modules/placements/tpo-general-request-model";

const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const C="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const reason="Please review the attached evidence";
const off={kind:"OFF_CAMPUS_OFFER",reason,companyName:"Sample Corp",ctcLpa:"8.50",proofUrl:"https://example.org/offer"};
const registration={kind:"REGISTRATION_CHANGE",reason,cohortId:A,choice:"HIGHER_STUDIES",consentConfirmed:false};
const absence={kind:"ABSENCE_DISPUTE",reason,applicationId:A,roundId:B,proofUrl:"https://example.org/proof"};
const correction={kind:"CORRECTION_WITH_PROOF",reason,section:"EDUCATION",field:"cgpa",proposedValue:"8.8",proofUrl:"https://example.org/marksheet"};
const after={kind:"PLACEMENT_AFTER_PLACEMENT",reason,requestedJobId:C,justification:"I want a new opportunity"};
const accepted={kind:"OFFER_ACCEPTANCE_DISPUTE",reason,offerId:B};
const valid=(input:unknown)=>tpoGeneralRequestInputSchema.safeParse(input).success;

describe("TPO-requests-verification-01: independent request-kind validation and 0134 safety",()=>{
 it("TPO-requests-verification-01 accepts a verified off-campus offer payload",()=>expect(valid(off)).toBe(true));
 it("TPO-requests-verification-01 accepts a complete registration-choice change",()=>expect(valid(registration)).toBe(true));
 it("TPO-requests-verification-01 accepts a round-specific absence dispute",()=>expect(valid(absence)).toBe(true));
 it("TPO-requests-verification-01 accepts education correction with independent proof",()=>expect(valid(correction)).toBe(true));
 it("TPO-requests-verification-01 accepts post-placement eligibility requests",()=>expect(valid(after)).toBe(true));
 it("TPO-requests-verification-01 validates the sixth kind at the API boundary, not the 0134 CHECK",()=>expect(valid(accepted)).toBe(true));
 it("TPO-requests-verification-01 refuses an empty correction proof link",()=>expect(valid({...correction,proofUrl:""})).toBe(false));
 it("TPO-requests-verification-01 refuses an omitted correction proof link",()=>expect(valid({...correction,proofUrl:undefined})).toBe(false));
 it("TPO-requests-verification-01 refuses non-HTTPS correction proof",()=>expect(valid({...correction,proofUrl:"http://example.org/proof"})).toBe(false));
 it("TPO-requests-verification-01 refuses a credential-bearing proof URL",()=>expect(valid({...correction,proofUrl:"https://user:pass@example.org/proof"})).toBe(false));
 it("TPO-requests-verification-01 refuses FTP proof links",()=>expect(valid({...correction,proofUrl:"ftp://example.org/proof"})).toBe(false));
 it("TPO-requests-verification-01 refuses relative proof links",()=>expect(valid({...correction,proofUrl:"/private-file"})).toBe(false));
 it("TPO-requests-verification-01 bounds externally supplied proof URLs to 2048 characters",()=>expect(valid({...correction,proofUrl:"https://example.org/"+ "a".repeat(2050)})).toBe(false));
 it("TPO-requests-verification-01 rejects zero pay despite a syntactically numeric salary",()=>expect(valid({...off,ctcLpa:"0.00"})).toBe(false));
 it("TPO-requests-verification-01 accepts positive fractional compensation",()=>expect(valid({...off,ctcLpa:"0.01"})).toBe(true));
 it("TPO-requests-verification-01 refuses negative compensation",()=>expect(valid({...off,ctcLpa:"-1"})).toBe(false));
 it("TPO-requests-verification-01 refuses over-precision compensation",()=>expect(valid({...off,ctcLpa:"8.999"})).toBe(false));
 it("TPO-requests-verification-01 refuses blank employer names",()=>expect(valid({...off,companyName:"  "})).toBe(false));
 it("TPO-requests-verification-01 refuses blank proposed academic corrections",()=>expect(valid({...correction,proposedValue:" "})).toBe(false));
 it("TPO-requests-verification-01 refuses missing cohort identity",()=>expect(valid({...registration,cohortId:undefined})).toBe(false));
 it("TPO-requests-verification-01 rejects an unknown registration choice",()=>expect(valid({...registration,choice:"PLACED"})).toBe(false));
 it("TPO-requests-verification-01 rejects an unknown correction section",()=>expect(valid({...correction,section:"PASSWORD"})).toBe(false));
 it("TPO-requests-verification-01 validates nonblank reasons",()=>expect(valid({...off,reason:"  "})).toBe(false));
 it("TPO-requests-verification-01 caps request reasons at 2000 characters",()=>expect(valid({...off,reason:"a".repeat(2001)})).toBe(false));
 it("TPO-requests-verification-01 limits correction target keys to the registered 150 characters",()=>{
  const parsed=tpoGeneralRequestInputSchema.parse({...correction,field:"A".repeat(140)});
  expect(tpoGeneralRequestTarget(parsed)).toHaveLength(150);
  expect(valid({...correction,field:"A".repeat(141)})).toBe(false);
 });
 it("TPO-requests-verification-01 assigns different absence target keys by round",()=>{
  const left=tpoGeneralRequestInputSchema.parse(absence);
  const right=tpoGeneralRequestInputSchema.parse({...absence,roundId:C});
  expect(tpoGeneralRequestTarget(left)).not.toEqual(tpoGeneralRequestTarget(right));
 });
 it("TPO-requests-verification-01 uses the batch ID as registration target",()=>{
  expect(tpoGeneralRequestTarget(tpoGeneralRequestInputSchema.parse(registration))).toBe(A);
 });
 it("TPO-requests-verification-01 retains a discriminated domain payload for auditing",()=>{
  expect(tpoGeneralRequestPayload(tpoGeneralRequestInputSchema.parse(off))).toMatchObject({kind:"OFF_CAMPUS_OFFER",companyName:"Sample Corp"});
 });
 it("TPO-requests-verification-01 requires explicit approval confirmation",()=>{
  expect(tpoGeneralRequestDecisionSchema.safeParse({confirmed:false,version:A,action:"APPROVE",note:""}).success).toBe(false);
 });
 it("TPO-requests-verification-01 refuses a silent rejection",()=>{
  expect(tpoGeneralRequestDecisionSchema.safeParse({confirmed:true,version:A,action:"REJECT",note:" "}).success).toBe(false);
 });
 it("TPO-requests-verification-01 accepts approval without a mandatory note",()=>{
  expect(tpoGeneralRequestDecisionSchema.safeParse({confirmed:true,version:A,action:"APPROVE",note:""}).success).toBe(true);
 });
 it("TPO-requests-verification-01 accepts reasoned rejection",()=>{
  expect(tpoGeneralRequestDecisionSchema.safeParse({confirmed:true,version:A,action:"REJECT",note:"Evidence does not match"}).success).toBe(true);
 });
 it("TPO-requests-verification-01 refuses stale or malformed decision versions",()=>{
  expect(tpoGeneralRequestDecisionSchema.safeParse({confirmed:true,version:"stale",action:"APPROVE",note:""}).success).toBe(false);
 });
});
