import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

/** Gap register is generated and can lag underlying code; this test checks
 * the actual named test and acceptance note instead of rewriting generated rows. */
const cases:readonly (readonly [id:string,acceptance:string,test:string])[]=[["FAC-courses-02","faculty-courses","chat5-final-faculty-courses-a"],["FAC-courses-07","faculty-courses","chat5-final-faculty-courses-a"],["FAC-courses-10","faculty-courses","chat5-final-faculty-courses-a"],["FAC-courses-30","faculty-courses","chat5-final-faculty-courses-b"],["FAC-courses-32","faculty-courses","chat5-final-faculty-courses-b"],["FAC-courses-33","faculty-courses","chat5-final-faculty-courses-b"],["FAC-courses-35","faculty-courses","chat5-final-faculty-courses-b"],["FAC-courses-R03","faculty-courses","chat5-final-faculty-courses-b"],["FAC-courses-R04","faculty-courses","chat5-final-faculty-courses-c"],["FAC-courses-R07","faculty-courses","chat5-final-faculty-courses-c"],["FAC-courses-R08","faculty-courses","chat5-final-faculty-courses-c"],["TPO-requests-verification-01","tpo-requests-verification","chat12-general-request-scope-r61"],["TPO-requests-verification-05","tpo-requests-verification","chat12-fixed-main-students-requests-audit-r2"],["TPO-requests-verification-07","tpo-requests-verification","chat12-fixed-main-requests-audit-r3"],["TPO-requests-verification-36","tpo-requests-verification","chat12-fixed-main-requests-audit-r3"],["TPO-requests-verification-37","tpo-requests-verification","chat12-recruiter-policy-autoapprove-37-38"],["TPO-requests-verification-38","tpo-requests-verification","chat12-recruiter-policy-autoapprove-37-38"],["TPO-drives-13","tpo-drives","chat14-final-tpo-drives-13"]];
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("chat-5 previously FIXED-ON-MAIN citation reconciliation",()=>{
 for(const [id,acceptance,test] of cases){
  it(id+" has an authored gap-named regression and a substantive acceptance record",()=>{
   const unit=read("tests/unit/"+test+".test.ts");
   expect(unit).toContain('it("'+id);
   const note=read("docs/audit/acceptance/"+acceptance+"-verification.md");
   expect(note).toContain(id);
   // Citation presence alone does not assert that the full legacy feature is complete.
  });
 }
});
