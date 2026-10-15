import {describe,it,expect} from "vitest";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
import {verificationLearnerNamePattern} from "@/modules/verification/queue-name-pattern";
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
