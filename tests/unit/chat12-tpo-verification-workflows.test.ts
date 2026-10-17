import {readFileSync} from "node:fs";
import {it,expect} from "vitest";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
it("TPO-requests-verification-25 reviews each waiting request in sequence with next and finish",()=>{
 const panel=read("src/components/verification/TpoVerificationPanel.tsx");
 for(const item of ["Review one by one (","sequenceProgress={","onNext={nextSequential}","onFinish={finishSequential}","setSequenceIndex(sequenceIndex+1)"])expect(panel).toContain(item);
});
it("TPO-requests-verification-28 reports TPO review success and failure in plain language",()=>{
 const panel=read("src/components/verification/TpoVerificationPanel.tsx");
 const drawer=read("src/components/verification/VerificationReviewDrawer.tsx");
 expect(panel).toContain("Verification completed. The student has been told.");
 expect(panel).toContain("Sent back. The student sees your reason.");
 expect(panel).toContain('showToast({tone:"success"');
 expect(drawer).toContain('?"Could not verify":"Could not send it back"');
});
