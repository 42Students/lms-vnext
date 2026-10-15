import {expect,it} from "vitest";
import {learnerOffersCsv} from "@/modules/placements/learner-offers-csv-model";
it("exports the displayed own offer metadata with spreadsheet formula neutralization",()=>{
 const csv=learnerOffersCsv([{
  offerId:"secret",applicationId:"hidden",companyName:"+Fake Corp",jobTitle:"Engineer",
  roleTitle:"Backend",kind:"LOI",status:"ISSUED",annualCtcInr:1200000,
  joiningDate:null,issuedAt:"2026-10-15T00:00:00Z",expiresAt:null,joining:null,
 }]);
 expect(csv).toContain("'+Fake Corp");
 expect(csv).toContain("LOI");
 expect(csv).not.toContain("secret");
 expect(csv).not.toContain("hidden");
});
