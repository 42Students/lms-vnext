import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {tpoNoticeTextParts} from "@/modules/announcements/tpo-notice-safe-links";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO notice link rendering",()=>{
 it("TPO-inbox-team-49 opens only HTTPS links and keeps punctuation in the body",()=>{
  expect(tpoNoticeTextParts("Read https://example.org/guide?x=1, today.")).toEqual([
   {kind:"text",value:"Read "},{kind:"link",value:"https://example.org/guide?x=1"},
   {kind:"text",value:","},{kind:"text",value:" today."},
  ]);
  expect(tpoNoticeTextParts("http://unsafe.test and www.example.test")).toEqual([
   {kind:"text",value:"http://unsafe.test and www.example.test"},
  ]);
 });
 it("TPO-inbox-team-49 never turns escaped or syntactically invalid URLs into outbound buttons",()=>{
  expect(tpoNoticeTextParts("https://<img>").every(part=>part.kind==="text")).toBe(true);
  const page=src("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(page).toContain("tpoNoticeTextParts(row.message).map");
  expect(page).toContain('rel="noopener noreferrer"');
  expect(page).toContain('row.buttonUrl?.startsWith("https://")');
 });
 it("TPO-inbox-team-62 keeps Messages and bell counts on an active 30-second poll plus visibility refresh",()=>{
  const indicators=src("src/components/tpo/tpo-header-indicators.tsx");
  expect(indicators).toContain("window.setInterval(");
  expect(indicators).toContain("},30000)");
  expect(indicators).toContain('document.addEventListener("visibilitychange",onVisibility)');
  expect(indicators).toContain("/api/tpo/header-snapshot");
  expect(indicators).toContain("setSnapshot(");
 });
});
