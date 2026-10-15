import {describe,it,expect} from "vitest";
import {verificationTabCounts} from "@/modules/verification/queue-tabs";
describe("shared verification workspace status contract",()=>{it("keeps submitted updates in the waiting tab",()=>{
 expect(verificationTabCounts([{status:"UPDATE_PENDING"},{status:"VERIFIED"}])).toEqual({WAITING:1,SENT_BACK:0,VERIFIED:1});
});});