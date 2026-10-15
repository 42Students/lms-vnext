import {expect,it} from "vitest";
import {isHrDriveProposalResponse} from "@/modules/placements/hr-drive-proposal-response-model";
it("only recognizes a persisted message receipt with exact thread and message identifiers",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 expect(isHrDriveProposalResponse({threadId:id,messageId:id,replayed:false})).toBe(true);
 expect(isHrDriveProposalResponse({threadId:id,replayed:false})).toBe(false);
 expect(isHrDriveProposalResponse({threadId:"/evil",messageId:id,replayed:false})).toBe(false);
});
