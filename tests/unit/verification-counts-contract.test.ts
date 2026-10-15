import {describe,it,expect} from "vitest";
import {verificationTabCounts} from "@/modules/verification/queue-tabs";
describe("verification counts contract",()=>{it("does not mistake one displayed page for the whole queue",()=>{
 const counts=verificationTabCounts([{status:"VERIFIED"},{status:"SUBMITTED"}]);
 expect(counts).toEqual({WAITING:1,SENT_BACK:0,VERIFIED:1});
});});
