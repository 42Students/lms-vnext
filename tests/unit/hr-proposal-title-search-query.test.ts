import {expect,it} from "vitest";
import {hrDriveProposalHistoryQuerySchema} from "@/modules/placements/hr-drive-proposal-history-model";
it("bounds role title search without accepting caller-owned recipient, college or SQL fragments",()=>{
 const q=hrDriveProposalHistoryQuerySchema.parse({q:"  Data Analyst ",page:"2"});
 expect(q.q).toBe("Data Analyst");
 expect(hrDriveProposalHistoryQuerySchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
 expect(hrDriveProposalHistoryQuerySchema.safeParse({q:"engineer",recipientUserId:"attacker"}).success).toBe(false);
});
