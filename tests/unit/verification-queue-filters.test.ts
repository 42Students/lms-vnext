import {describe,it,expect} from "vitest";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
import {verificationLearnerNamePattern} from "@/modules/verification/queue-name-pattern";
import {matchesVerificationAttention} from "@/modules/verification/attention-filter";
describe("verification queue boundaries",()=>{it("rejects foreign scope and malformed dates",()=>{
 expect(verificationQueueFilters.safeParse({collegeId:"foreign"}).success).toBe(false);
 expect(verificationQueueFilters.safeParse({waitingSince:"2026-99-99"}).success).toBe(false);
 expect(verificationQueueFilters.parse({})).toMatchObject({tab:"WAITING",marksheets:"ANY",page:1});
});});
describe("verification private-safe name search",()=>{it("bounds query and quotes literal SQL wildcards",()=>{
 expect(verificationQueueFilters.parse({q:"  Asha  "}).q).toBe("Asha");
 expect(verificationQueueFilters.safeParse({q:"x".repeat(101)}).success).toBe(false);
 expect(verificationLearnerNamePattern("A%_")).toBe("%A\\%\\_%");
});});

describe("missing marksheet attention",()=>{it("selects education requests with missing marksheets only",()=>{
 const now=new Date("2026-10-15T00:00:00Z"),base={status:"SUBMITTED" as const,section:"EDUCATION" as const,submittedAt:now};
 expect(matchesVerificationAttention({...base,missingMarksheet:true},"MISSING_MARKSHEET",now)).toBe(true);
 expect(matchesVerificationAttention({...base,missingMarksheet:false},"MISSING_MARKSHEET",now)).toBe(false);
 expect(verificationQueueFilters.safeParse({attention:"INVALID"}).success).toBe(false);
});});

describe("verified-details change attention",()=>{it("finds UPDATE_PENDING and excludes ordinary verified records",()=>{
 const now=new Date("2026-10-15T00:00:00Z");
 expect(matchesVerificationAttention({status:"UPDATE_PENDING",section:"IDENTITY",submittedAt:now,missingMarksheet:false},"VERIFIED_DETAILS_CHANGED",now)).toBe(true);
 expect(matchesVerificationAttention({status:"VERIFIED",section:"IDENTITY",submittedAt:now,missingMarksheet:false},"VERIFIED_DETAILS_CHANGED",now)).toBe(false);
});});

describe("overdue verification attention",()=>{it("uses a consistent seven-day window and waiting states",()=>{
 const now=new Date("2026-10-15T00:00:00Z"),old=new Date("2026-10-07T00:00:00Z");
 expect(matchesVerificationAttention({status:"SUBMITTED",section:"IDENTITY",submittedAt:old,missingMarksheet:false},"WAITING_OVER_WEEK",now)).toBe(true);
 expect(matchesVerificationAttention({status:"SENT_BACK",section:"IDENTITY",submittedAt:old,missingMarksheet:false},"WAITING_OVER_WEEK",now)).toBe(false);
 expect(matchesVerificationAttention({status:"SUBMITTED",section:"IDENTITY",submittedAt:now,missingMarksheet:false},"WAITING_OVER_WEEK",now)).toBe(false);
});});

describe("verification per-page policy",()=>{it("accepts bounded 10/25/50 and rejects oversized pages",()=>{
 expect(verificationQueueFilters.parse({pageSize:10}).pageSize).toBe(10);
 expect(verificationQueueFilters.parse({pageSize:50}).pageSize).toBe(50);
 expect(verificationQueueFilters.safeParse({pageSize:51}).success).toBe(false);
});});

describe("verification sort input",()=>{it("accepts only newest or oldest timestamps",()=>{
 expect(verificationQueueFilters.parse({sort:"NEWEST"}).sort).toBe("NEWEST");
 expect(verificationQueueFilters.safeParse({sort:"MANUAL"}).success).toBe(false);
});});
