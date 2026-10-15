import {expect,it} from "vitest";
import {tpoShareableShortlistQuerySchema} from "@/modules/placements/tpo-shareable-shortlist-model";
import {escapeLiteralApplicantSearch} from "@/modules/placements/company-share/public-filter-model";
it("validates literal server-enforced shortlist name search",()=>{
 const jobId="11111111-1111-4111-8111-111111111111";
 expect(tpoShareableShortlistQuerySchema.parse({jobId,q:" Ana "}).q).toBe("Ana");
 expect(tpoShareableShortlistQuerySchema.safeParse({jobId,q:"x".repeat(81)}).success).toBe(false);
 expect(escapeLiteralApplicantSearch("A_%")).toBe("A\\_\\%");
});
