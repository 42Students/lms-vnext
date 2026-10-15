import {describe,it,expect} from "vitest";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
describe("verification queue boundaries",()=>{it("rejects foreign scope and malformed dates",()=>{
 expect(verificationQueueFilters.safeParse({collegeId:"foreign"}).success).toBe(false);
 expect(verificationQueueFilters.safeParse({waitingSince:"2026-99-99"}).success).toBe(false);
 expect(verificationQueueFilters.parse({})).toMatchObject({tab:"WAITING",marksheets:"ANY",page:1});
});});