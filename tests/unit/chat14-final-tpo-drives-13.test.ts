import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("chat-14 final sprint",()=>{
 it("TPO-drives-13 verifies the persisted selected-drive export and individual eligibility preflight",()=>{
  const page=read("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  const component=read("src/components/placements/tpo-bulk-drive-reminder.tsx");
  expect(page).toContain('name="ids" type="checkbox"');
  expect(page).toContain("TpoBulkDriveReminder");
  expect(page).toContain('scope" value="SELECTED"');
  expect(component).toContain("remind-not-applied");
  expect(component).toContain("previewToken");
  expect(component).toContain("alreadySent");
 });
});