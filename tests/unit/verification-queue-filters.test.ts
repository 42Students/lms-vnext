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
