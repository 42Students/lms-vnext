import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {readTpoCampaignBody,readTpoSettingsBody} from "@/modules/placements/tpo-communication-request-model";

const request=(body:string)=>new Request("https://college.example.test/api/placements/tpo/campaigns/drafts",{
 method:"POST",headers:{"Content-Type":"application/json"},body,
});
describe("TPO-campaigns-public-12 campaign request body bounds and draft preservation",()=>{
 it("accepts a legitimate 10,000-character multibyte campaign body up to 64 KiB",async()=>{
  const body=JSON.stringify({title:"Recruiters",subject:"A message",body:"あ".repeat(10000)});
  expect(new TextEncoder().encode(body).length).toBeGreaterThan(8192);
  const read=await readTpoCampaignBody(request(body));
  expect(read).toEqual({title:"Recruiters",subject:"A message",body:"あ".repeat(10000)});
  await expect(readTpoSettingsBody(request(body))).rejects.toMatchObject({code:"BODY_TOO_LARGE"});
 });
 it("rejects over-64KiB campaign requests without a Content-Length hint",async()=>{
  const huge=JSON.stringify({body:"x".repeat(66000)});
  await expect(readTpoCampaignBody(request(huge))).rejects.toMatchObject({code:"BODY_TOO_LARGE"});
 });
 it("campaign draft and audience preview verify origin before parsing capped payloads",()=>{
  const drafts=readFileSync("src/app/api/placements/tpo/campaigns/drafts/route.ts","utf8");
  const audience=readFileSync("src/app/api/placements/tpo/campaigns/preview-selected/route.ts","utf8");
  for(const s of [drafts,audience]){
   expect(s).toContain("isSameOriginRequest(request)");
   expect(s).toContain("TpoCommunicationBodyError");
   expect(s).toContain("BODY_TOO_LARGE");
   expect(s).toContain("413:400");
   expect(s).not.toContain("await request.json()");
  }
  expect(drafts).toContain("readTpoCampaignBody(request)");
  expect(audience).toContain("readTpoSettingsBody(request)");
  expect(drafts.indexOf("isSameOriginRequest(request)")).toBeLessThan(drafts.indexOf("readTpoCampaignBody(request)"));
  expect(audience.indexOf("isSameOriginRequest(request)")).toBeLessThan(audience.indexOf("readTpoSettingsBody(request)"));
 });
});
