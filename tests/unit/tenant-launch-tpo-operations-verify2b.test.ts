import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
describe("legacy tenant launch and TPO operations verification",()=>{
 it("renders the real sign-in radio choices and saves in place",()=>{
  const form=source("src/components/admin/college-signin-method-form.tsx");
  const launch=source("src/app/(authenticated)/admin/tenants/setup/page.tsx");
  expect(form).toContain('role="radiogroup"');
  expect(form).toContain('role="radio" aria-checked={selected}');
  expect(form).toContain("Sign-in settings saved");
  expect(launch).toContain("<CollegeSigninMethodForm");
 });
 it("keeps placements operations and scoped recovery visible",()=>{
  const admin=source("src/app/(authenticated)/admin/placements/page.tsx");
  expect(admin).toContain('aria-label="Placement quick actions"');
  expect(admin).toContain('aria-label="Drive actions"');
  expect(admin).toContain("<PlacementOperationsWorkspace");
  expect(admin).toContain("/admin/placements/student-lookup");
  const day=source("src/app/(authenticated)/tpo/drive-day/page.tsx");
  expect(day).toContain("<TpoDriveDayLoadWarning");
 });
 it("bounds TPO notice receipts and does not remind unsent notices",()=>{
  const sourceText=source("src/components/tpo/tpo-notice-read-progress.tsx");
  expect(sourceText).toContain('const isSent=status==="SENT"');
  expect(sourceText).toContain('data.unread.slice(0,500)');
  expect(sourceText).toContain("const load=useCallback");
  expect(sourceText).not.toContain("eslint-disable");
  expect(sourceText).toContain("Reminders can be sent once per hour");
 });
 it("keeps Request Demo metadata and encoded, same-tab mailto form",()=>{
  const demo=source("src/app/request-demo/page.tsx");
  expect(demo).toContain("encodeURIComponent(DEMO_TITLE)");
  expect(demo).toContain("encodeURIComponent(");
  expect(demo).toContain("alternates: { canonical:");
 });
});
