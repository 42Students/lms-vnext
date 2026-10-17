import {expect,it} from "vitest";
import {companyShareIssueSchema} from "@/modules/placements/company-share/token-model";
const jobId="11111111-1111-4111-8111-111111111111";
it("rejects unsolicited fields, invalid TTL and invalid job IDs",()=>{
 expect(companyShareIssueSchema.safeParse({jobId,expiresInDays:1}).success).toBe(true);
 expect(companyShareIssueSchema.safeParse({jobId,expiresInDays:0}).success).toBe(false);
 expect(companyShareIssueSchema.safeParse({jobId,expiresInDays:90}).success).toBe(true);
 expect(companyShareIssueSchema.safeParse({jobId,expiresInDays:91}).success).toBe(false);
 expect(companyShareIssueSchema.safeParse({jobId,expiresInDays:1,email:"x"}).success).toBe(false);
 expect(companyShareIssueSchema.safeParse({jobId:"unexpected"}).success).toBe(false);
});
