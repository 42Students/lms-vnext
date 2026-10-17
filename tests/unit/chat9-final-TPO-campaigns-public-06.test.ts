import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-9 final sprint",()=>{
 it("TPO-campaigns-public-06 verifies the implemented contract",()=>{
  const engage=read("src/app/(authenticated)/tpo/recruiters/page.tsx");
  const history=read("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx");
  expect(engage).toContain('requested === "campaigns"');
  expect(engage).toContain("<CampaignHistory");
  expect(history).toContain('title="Emails"');
  expect(history).toContain('["campaigns","Emails"]');
  expect(history).toContain("To send one, select recruiters in the table and choose Act, then Send an email.");
 });
});
