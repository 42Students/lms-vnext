import {readFileSync} from "node:fs";import {it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-requests-verification-28 keeps action-specific success, failure, and nontechnical document-open messages",()=>{
 const page=src("src/components/verification/TpoVerificationPanel.tsx");
 const drawer=src("src/components/verification/VerificationReviewDrawer.tsx");
 const route=src("src/app/api/tpo/verification/[membershipId]/[section]/documents/[receiptId]/route.ts");
 expect(page).toContain("verified. The student has been told.");
 expect(page).toContain("Sent back. The student sees your reason.");
 expect(drawer).toContain('"Could not verify"');
 expect(drawer).toContain('"Could not send it back"');
 expect(drawer).toContain('"Could not open this student"');
 expect(route).toContain("You cannot open this document");
 expect(route).toContain('request.headers.get("accept")?.includes("text/html")');
});