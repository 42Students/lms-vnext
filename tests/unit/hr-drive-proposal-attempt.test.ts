import {expect,it} from "vitest";
import {nextHrProposalAttempt} from "@/modules/placements/hr-drive-proposal-attempt-model";
it("reuses submission identity for retry but changes it when the draft changes",()=>{
 const first=nextHrProposalAttempt(null,"draft1",()=>"id1");
 const repeated=nextHrProposalAttempt(first,"draft1",()=>"id2");
 const updated=nextHrProposalAttempt(first,"draft2",()=>"id2");
 expect(repeated).toBe(first);
 expect(updated.submissionId).toBe("id2");
});
