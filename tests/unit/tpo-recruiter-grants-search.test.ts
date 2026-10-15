import {expect,it} from "vitest";
import {tpoRecruiterAccessQuerySchema,tpoRecruiterAccessHref} from "@/modules/placements/tpo-recruiter-access-model";
import {escapeLiteralApplicantSearch} from "@/modules/placements/company-share/public-filter-model";
it("validates bounded recruiter name search and preserves status/page in URL",()=>{
 expect(tpoRecruiterAccessQuerySchema.parse({q:"  Acme  "}).q).toBe("Acme");
 expect(tpoRecruiterAccessQuerySchema.safeParse({q:"x".repeat(81)}).success).toBe(false);
 expect(tpoRecruiterAccessHref({status:"REVOKED",q:"A&B",page:2}))
  .toContain("q=A%26B");
 expect(escapeLiteralApplicantSearch("100%")).toBe("100\\%");
});
