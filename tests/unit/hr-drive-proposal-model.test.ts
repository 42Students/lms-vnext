import {expect,it} from "vitest";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
import {formatHrDriveProposal,hrDriveProposalSchema} from "@/modules/placements/hr-drive-proposal-model";
const collegeId="11111111-1111-4111-8111-111111111111";
const submissionId="22222222-2222-4222-8222-222222222222";
const draft={...emptyHrDriveDraft(),title:"Data engineer",
 description:"Build robust data pipelines.",location:"Hyderabad"};
it("renders a bounded, explicitly non-approval placement-cell proposal",()=>{
 const body=formatHrDriveProposal({collegeId,submissionId,draft});
 expect(body).toContain("NOT a submitted approval request");
 expect(body).toContain("Data engineer");
 expect(body).toContain(submissionId);
 expect(body.length).toBeLessThanOrEqual(4000);
});
it("rejects caller-supplied employer IDs and oversize proposal content",()=>{
 expect(hrDriveProposalSchema.safeParse({collegeId,submissionId,draft,companyId:collegeId}).success).toBe(false);
 expect(()=>formatHrDriveProposal({collegeId,submissionId,draft:{...draft,description:"x".repeat(4000)}}))
  .toThrow("DRIVE_PROPOSAL_MESSAGE_TOO_LONG");
});
