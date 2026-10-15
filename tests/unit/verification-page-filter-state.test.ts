import {describe,it,expect} from "vitest";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
describe("verification page filter state",()=>{it("accepts verified tab and education kind",()=>{
 expect(verificationQueueFilters.parse({tab:"VERIFIED",kind:"EDUCATION",page:"1"})).toMatchObject({tab:"VERIFIED",kind:"EDUCATION",page:1});
});});
