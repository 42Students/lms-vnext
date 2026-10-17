import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-9 final sprint",()=>{
 it("TPO-campaigns-public-08 verifies the implemented contract",()=>{
  const page=read("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx");
  const composer=read("src/components/tpo/tpo-campaign-compose.tsx");
  const send=read("src/components/tpo/tpo-campaign-send-control.tsx");
  const copy="Campaign email is not set up yet, so nothing can be sent. Ask 42 to switch it on.";
  for(const item of [page,composer,send])expect(item).toContain(copy);
  expect(send).toContain("disabled={!ready||busy||recipients===0}");
  expect(composer).toContain("Save draft");
 });
});
