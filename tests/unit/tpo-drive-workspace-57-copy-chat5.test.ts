import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
describe("TPO drive offers legacy expiry disclosure",()=>{
 it("TPO-drive-workspace-57 presents exact release deadline and Sunday holiday copy",()=>{
  const ui=readFileSync("src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx","utf8");
  expect(ui).toContain("Students see an offer only when you release it. The respond-by time is at least 48 hours and never ends on a Sunday or holiday.");
  expect(ui).toContain("Respond by");
  expect(ui).toContain("row.respondByHours");
  expect(ui).toContain("Issue");
 });
});
