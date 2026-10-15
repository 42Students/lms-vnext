import {describe,it,expect} from "vitest";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
describe("college verification page filters",()=>{it("rejects unrecognized college override",()=>{
 expect(verificationQueueFilters.safeParse({collegeId:"other"}).success).toBe(false);
 expect(verificationQueueFilters.parse({tab:"WAITING"}).tab).toBe("WAITING");
});});
