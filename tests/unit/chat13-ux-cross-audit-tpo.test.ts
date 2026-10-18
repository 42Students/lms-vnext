import { describe,it,expect } from "vitest";
import { readFileSync } from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
describe("chat-13 TPO second-third cross-audit repairs",()=>{
 it("UX-cross-tpo-second-C13-001 letters use responsive accessible evidence, no falsified letter states",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx");
  expect(s).toContain('DataTable<(typeof offers)[number]>');
  expect(s).toContain('Letter acknowledged');
  expect(s).toContain('empty={<p role="status"');
  expect(s).toContain('Unavailable');
  expect(s).not.toContain('<table');
 });
 it("UX-cross-tpo-second-C13-002 share audit preserves UTC evidence on phone and paging",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx");
  expect(s).toContain('<DataTable');
  expect(s).toContain('UTC timestamp');
  expect(s).toContain('No share-page views or CSV downloads match this event filter for this drive.');
  expect(s).toContain('companyShareAuditPageHref');
  expect(s).not.toContain('<table');
 });
 it("UX-cross-tpo-second-C13-003 shortlist retains evidence fields and all result states",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/page.tsx");
  expect(s).toContain('DataTable<(typeof data.rows)[number]>');
  expect(s).toContain('Shortlisted at (IST)');
  expect(s).toContain('Decision timestamp unavailable');
  expect(s).toContain('A previously shortlisted learner may have withdrawn');
  expect(s).not.toContain('<table');
 });
});
