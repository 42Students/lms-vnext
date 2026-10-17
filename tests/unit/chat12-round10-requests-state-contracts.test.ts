import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("chat-12 requests and verification queue residual contracts",()=>{
 it("TPO-requests-verification-16 keeps page-selected requests scoped to visible rows",()=>{
  const page=src("src/app/(authenticated)/tpo/requests/page.tsx");
  const select=src("src/components/placements/tpo-request-page-clipboard.tsx");
  expect(page).toContain("<TpoRequestPageClipboard");
  expect(select).toContain("rows.filter(row=>selected.includes(row.id))");
  expect(page).toContain("DECIDED_NEWEST");
 });
 it("TPO-requests-verification-21 gives denied TPOs a college-facing explanation",()=>{
  const page=src("src/app/(authenticated)/tpo/verification/page.tsx");
  expect(page).toContain("You cannot verify profiles here");
  expect(page).toContain("Your college admin has not allowed the placement cell to verify profiles");
 });
 it("TPO-requests-verification-29 keeps secure document review and prior decision evidence",()=>{
  const drawer=src("src/components/verification/VerificationReviewDrawer.tsx");
  expect(drawer).toContain("Recorded decision history");
  expect(drawer).toContain("submittedSnapshot.education");
  expect(drawer).toContain("documents/");
 });
});
