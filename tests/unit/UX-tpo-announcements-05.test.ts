import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/announcements/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-announcements-05",()=>{
 it("keeps announcement links in the app tab without changing safe HTTPS CTA gating",()=>{
  // In-app navigation stays in the same tab; HTTPS external CTAs can open separately
  // but must never carry an opener or the full referrer.
  expect(source).toContain('rel="noopener noreferrer"');
  expect(source).toContain('referrerPolicy="no-referrer"');
  expect(source).not.toContain('target="_self"');
  expect(source).toContain("tpoNoticeTextParts(row.message)");
  expect(source).toContain('row.buttonUrl?.startsWith("https://")');
  expect(source).toContain("{row.buttonLabel} ↗");
 });
});
