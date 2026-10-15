import {describe,it,expect} from "vitest";
import {verificationTabCounts} from "@/modules/verification/queue-tabs";
describe("persisted queue status mapping",()=>{it("counts pending verified updates as waiting",()=>{
 expect(verificationTabCounts([{status:"UPDATE_PENDING"},{status:"SENT_BACK"},{status:"SUBMITTED"}]))
 .toEqual({WAITING:2,SENT_BACK:1,VERIFIED:0});
});});
