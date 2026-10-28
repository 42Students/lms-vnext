import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoGeneralRequestReviewFacts} from "@/modules/placements/tpo-general-request-review-facts";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO general requests review evidence",()=>{
 it("TPO-requests-verification-01 shows company/CTC and safe HTTPS proof without arbitrary payload keys",()=>{
  const details=tpoGeneralRequestReviewFacts("OFF_CAMPUS_OFFER",{
   companyName:"Acme",ctcLpa:"7.50",proofUrl:"https://example.org/offer",
   secret:"hidden",password:"hidden",
  });
  expect(details.facts).toEqual([
   {label:"Company",value:"Acme"},{label:"Annual CTC",value:"7.50 LPA"},
  ]);
  expect(details.proofUrl).toBe("https://example.org/offer");
  expect(details.requiresProof).toBe(true);
  expect(JSON.stringify(details)).not.toContain("hidden");
 });
 it("TPO-requests-verification-01 safely warns for missing, unsafe or credential-bearing proof",()=>{
  for(const url of ["","http://example.org/offer","javascript:alert(1)","https://name:secret@example.org/file"]){
   const result=tpoGeneralRequestReviewFacts("CORRECTION_WITH_PROOF",{
    section:"EDUCATION",field:"Passing year",proposedValue:"2099",proofUrl:url,
   });
   expect(result.proofUrl).toBeNull();
   expect(result.requiresProof).toBe(true);
   expect(result.facts.map(fact=>fact.label)).toEqual(["Section","Field","Requested value"]);
  }
  const missing=tpoGeneralRequestReviewFacts("OFF_CAMPUS_OFFER",{proofUrl:""});
  expect(missing.proofIssue).toBe("No proof attached");
  for(const unsafe of ["javascript:alert(1)","http://example.org","https://u:p@example.org/"]){
   const bad=tpoGeneralRequestReviewFacts("OFF_CAMPUS_OFFER",{proofUrl:unsafe});
   expect(bad.proofUrl).toBeNull();
   expect(bad.proofIssue).toBe("Submitted proof is not a web link");
   expect(JSON.stringify(bad)).not.toContain(unsafe);
  }
  const ui=src("src/components/placements/tpo-general-requests-panel.tsx");
  expect(ui).toContain("<TpoGeneralRequestFacts kind={row.kind} payload={row.payload}/>");
  expect(ui).toContain('message={detail.proofIssue??"No proof attached"}');
  expect(ui).toContain('target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"');
  const notice=src("src/components/ui/inline-notice.tsx");
  expect(notice).toContain('role={tone === "error" ? "alert" : "status"}');
 });
 it("TPO-requests-verification-01 includes request-specific dispute, registration and post-placement facts",()=>{
  expect(tpoGeneralRequestReviewFacts("ABSENCE_DISPUTE",{applicationId:"app",roundId:"round"}).facts.length).toBe(2);
  expect(tpoGeneralRequestReviewFacts("REGISTRATION_CHANGE",{choice:"PLACEMENTS"}).facts[0]).toEqual({
   label:"Requested after-college choice",value:"PLACEMENTS",
  });
  expect(tpoGeneralRequestReviewFacts("PLACEMENT_AFTER_PLACEMENT",{
   requestedJobId:"job",justification:"Review again",
  }).facts.length).toBe(2);
 });
});
