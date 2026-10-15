import {expect,it} from "vitest";
import {companyShareRevokeSchema} from "@/modules/placements/company-share/token-model";
const jobId="11111111-1111-4111-8111-111111111111";
const shareId="22222222-2222-4222-8222-222222222222";
it("refuses arbitrary shared link ids and unrelated fields",()=>{
 expect(companyShareRevokeSchema.safeParse({jobId,shareId}).success).toBe(true);
 expect(companyShareRevokeSchema.safeParse({jobId,shareId:"bad"}).success).toBe(false);
 expect(companyShareRevokeSchema.safeParse({jobId,shareId,force:true}).success).toBe(false);
});
