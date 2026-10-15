import {expect,it} from "vitest";
import {prioritizeLearnerOffers} from "@/modules/placements/learner-offer-response-timing-model";
it("keeps valid issued offers before malformed imported offers without mutating the input",()=>{
 const issued="2026-10-15T00:00:00Z";
 const rows=[{status:"ISSUED" as const,issuedAt:"invalid",expiresAt:null},
 {status:"ISSUED" as const,issuedAt:issued,expiresAt:"2026-10-20T00:00:00Z"}];
 const sorted=prioritizeLearnerOffers(rows,issued);
 expect(sorted[0]).toBe(rows[1]);
 expect(rows[0].issuedAt).toBe("invalid");
});
