import {describe,it,expect} from "vitest";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
describe("advanced verification filters",()=>{it("accepts strict marksheet views",()=>{
 expect(verificationQueueFilters.parse({marksheets:"MISSING"}).marksheets).toBe("MISSING");
 expect(verificationQueueFilters.safeParse({marksheets:"ALL"}).success).toBe(false);
});});
