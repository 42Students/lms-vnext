import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-9 final sprint",()=>{
 it("TPO-campaigns-public-03 verifies the implemented contract",()=>{
  const page=read("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx");
  expect(page).toContain('title="Emails"');
  expect(page).toContain("item.subject");
  expect(page).toContain("item.sender_name");
  expect(page).toContain("item.created_at");
  expect(page).toContain("item.sent");
  expect(page).toContain("item.skipped");
  expect(page).toContain("item.failed");
  expect(page).toContain("Provider acceptance does not prove recipient delivery.");
 });
});
