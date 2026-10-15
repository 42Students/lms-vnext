import {describe,it,expect} from "vitest";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
describe("verification URL state",()=>{it("retains a typed status and page",()=>{
 expect(verificationQueueFilters.parse({tab:"VERIFIED",page:"2"})).toMatchObject({tab:"VERIFIED",page:2});
});});
