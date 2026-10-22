import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const ui=readFileSync("src/components/announcements/super-admin-college-broadcast-form.tsx","utf8");
const page=readFileSync("src/app/(authenticated)/admin/announcements/page.tsx","utf8");
describe("Super Admin all and selected college publishing",()=>{
 it("renders selected-college chooser and consent-based publish confirmation",()=>{
  expect(ui).toContain("SELECTED_COLLEGES");
  expect(ui).toContain("ALL_COLLEGES");
  expect(ui).toContain("publishConsent:true");
  expect(ui).toContain("Approve announcement to placement cells");
  expect(ui).toContain("Confirm the audience and expiry before immediate delivery.");
  expect(ui).toContain("confirmDisabled={!valid}");
  expect(page).toContain("SuperAdminCollegeBroadcastForm");
 });
});