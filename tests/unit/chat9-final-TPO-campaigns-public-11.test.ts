import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-9 final sprint",()=>{
 it("TPO-campaigns-public-11 verifies the implemented contract",()=>{
  const page=read("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx");
  const route=read("src/app/api/placements/tpo/campaigns/history/export/route.ts");
  expect(page).toContain('name="purpose"');
  expect(page).toContain('first(params.purpose)?"&purpose="+encodeURIComponent(first(params.purpose)!):""');
  expect(page).toContain("Export filtered history as CSV");
  expect(route).toContain("exportTpoMessagingHistory(context,parsed.data)");
  expect(route).toContain("CAMPAIGN_EXPORT_TOO_LARGE");
  expect(route).toContain('"X-Export-Scope":"All filtered batches"');
 });
});
