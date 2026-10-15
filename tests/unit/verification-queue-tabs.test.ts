import {describe,it,expect} from "vitest";
import {verificationTab,verificationTabCounts} from "@/modules/verification/queue-tabs";
describe("verification tabs",()=>{it("keeps updates to verified details in waiting",()=>{
 expect(verificationTab({status:"UPDATE_PENDING"})).toBe("WAITING");
 expect(verificationTabCounts([{status:"SUBMITTED"},{status:"UPDATE_PENDING"},{status:"SENT_BACK"},{status:"VERIFIED"}]))
 .toEqual({WAITING:2,SENT_BACK:1,VERIFIED:1});
});});