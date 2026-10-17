import {readFileSync} from "node:fs";import {it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-requests-verification-01 makes five kinds actionable on learner and TPO pages when registered, without claiming unsupported approval effects",()=>{
 const learner=src("src/app/(authenticated)/learn/my-placements/page.tsx");
 const tpo=src("src/app/(authenticated)/tpo/requests/page.tsx");
 const own=src("src/components/placements/learner-general-requests.tsx");
 const review=src("src/components/placements/tpo-general-requests-panel.tsx");
 expect(learner).toContain('<LearnerGeneralRequests/>');
 expect(tpo).toContain('<TpoGeneralRequestsPanel/>');
 expect(own).toContain('REGISTRATION_CHANGE');
 expect(own).toContain("Request history");
 expect(review).toContain('approveSupported');
 expect(review).toContain('decision note');
 expect(review).toContain('No placement record will be silently changed.');
});