import {expect,it} from "vitest";
import {previewHrDriveProposalMessage} from "@/modules/placements/hr-drive-proposal-history-model";
const id="11111111-1111-4111-8111-111111111111";
it("parses only the stable proposal header, not a forged or unvalidated message",()=>{
 const text="Drive proposal for placement cell discussion — NOT a submitted approval request\n"+
  "Proposal reference: "+id+"\nRole: Backend Engineer\nDescription:\nPrivate details";
 expect(previewHrDriveProposalMessage(text)).toEqual({referenceId:id,title:"Backend Engineer"});
 expect(JSON.stringify(previewHrDriveProposalMessage(text))).not.toContain("Private details");
 expect(previewHrDriveProposalMessage("Hello")).toBeNull();
 expect(previewHrDriveProposalMessage(text.replace(id,"invalid"))).toBeNull();
});
