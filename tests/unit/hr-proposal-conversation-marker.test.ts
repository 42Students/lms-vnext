import {expect,it} from "vitest";
import {recruiterProposalMessageMarker} from "@/modules/placements/hr-proposal-message-marker-model";
const body="Drive proposal for placement cell discussion — NOT a submitted approval request\n"+
 "Proposal reference: 11111111-1111-4111-8111-111111111111\nRole: Software Engineer\nDescription:";
it("identifies only recruiter-authored proposal messages, not ordinary placement-cell replies",()=>{
 expect(recruiterProposalMessageMarker("RECRUITER",body)?.title).toBe("Software Engineer");
 expect(recruiterProposalMessageMarker("TPO",body)).toBeNull();
 expect(recruiterProposalMessageMarker("RECRUITER","Hello")).toBeNull();
});
