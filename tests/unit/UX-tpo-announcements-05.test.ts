import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/announcements/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-announcements-05",()=>{
 it("keeps announcement links in the app tab without changing safe HTTPS CTA gating",()=>{
  expect(source).not.toContain('target="_blank"');
  expect(source).toContain("tpoNoticeTextParts(row.message)");
  expect(source).toContain('row.buttonUrl?.startsWith("https://")');
  expect(source).toContain("{row.buttonLabel} ↗");
 });
});
