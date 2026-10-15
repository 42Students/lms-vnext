import {expect,it} from "vitest";
import {companyShareIssueSchema} from "@/modules/placements/company-share/token-model";
it("allows seven-day maximum link issuance from a strict TPO input",()=>{
 const jobId="11111111-1111-4111-8111-111111111111";
 expect(companyShareIssueSchema.parse({jobId,expiresInDays:7}).expiresInDays).toBe(7);
 expect(companyShareIssueSchema.safeParse({jobId,expiresInDays:10}).success).toBe(false);
});
