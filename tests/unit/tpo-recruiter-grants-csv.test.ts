import {expect,it} from "vitest";
import {tpoRecruiterGrantCsv,tpoRecruiterGrantExportHref} from "@/modules/placements/tpo-recruiter-grant-export-model";
it("exports no IDs or contact fields and includes capped status",()=>{
 const csv=tpoRecruiterGrantCsv([{displayName:"=Bad",companyName:"Acme",status:"ACTIVE",
  grantedDate:"15 Oct 2026",revokedDate:null,grantId:"private",designation:null,validUntilDate:null,ended:false,capabilities:[],verificationStatus:"VERIFIED"}],true);
 expect(csv).toContain("NOTICE");
 expect(csv).toContain("'=Bad");
 expect(csv).not.toContain("private");
 expect(csv).not.toContain("Email");
 expect(tpoRecruiterGrantExportHref({status:"ACTIVE",q:"Acme"})).toContain("status=ACTIVE");
});
