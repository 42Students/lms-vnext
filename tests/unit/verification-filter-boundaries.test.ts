import {describe,it,expect} from "vitest";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
const uuid="68b00b08-aafb-44e5-8be0-81ef27f56ab9";
describe("verification academic filters",()=>{it("accepts typed selectors but rejects arbitrary tenant override",()=>{
 expect(verificationQueueFilters.safeParse({sectionId:uuid,batchId:uuid,branchId:uuid}).success).toBe(true);
 expect(verificationQueueFilters.safeParse({sectionId:"not-an-id"}).success).toBe(false);
 expect(verificationQueueFilters.safeParse({collegeId:uuid}).success).toBe(false);
});});
