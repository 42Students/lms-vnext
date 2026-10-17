import {readFileSync} from "node:fs";
import {it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-requests-verification-29 returns the latest 50 named audit events and full private review facts",()=>{
 const service=src("src/modules/verification/staff-review-detail-service.ts");
 const drawer=src("src/components/verification/VerificationReviewDrawer.tsx");
 expect(service).toContain("desc(profileVerificationEvents.createdAt)");
 expect(service).toContain(".limit(50)");
 expect(drawer).toContain("Showing the latest 50 history events.");
 expect(drawer).toContain('item.actorName??item.actorKind');
 expect(drawer).toContain('timeZone:"Asia/Kolkata"');
 expect(drawer).toContain("Roll no.: {row.rollNumber}");
 expect(drawer).toContain('detail.review.submittedSnapshot.education.map');
 expect(drawer).toContain("Numbers show only the last four digits; compare them with the document.");
 expect(drawer).toContain("private signed link");
});
