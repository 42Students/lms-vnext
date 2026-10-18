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
 it("UX-cross-tpo-second-C13-004 share preview renders one responsive authorized candidate list",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx");
  expect(s).toContain('<DataTable<(typeof data.rows)[number]>');
  expect(s).toContain('mobilePriority:"primary"');
  expect(s).toContain('No recruiter-visible shortlisted applications are recorded');
  expect(s).toContain('CompanyShareControls');
  expect(s).not.toContain('sm:hidden');
  expect(s).not.toContain('<table');
 });
 it("UX-cross-tpo-second-C13-005 rounds preserve externally usable links without new windows",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx");
  expect(s).toContain('Meeting link');
  expect(s).toContain('Test link');
  expect(s).not.toContain('target="_blank"');
  expect(s).toContain('min-h-11');
 });
 it("UX-cross-tpo-second-C13-006 overview primary actions are WCAG sized and contrast safe",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/overview/page.tsx");
  expect(s).not.toContain("min-h-9");
  expect(s).not.toContain("text-on-primary");
  expect(s).toContain('New opportunity');
 });
 it("UX-cross-tpo-second-C13-007 campaign CTA contrast and phone link targets",()=>{
  const s=read("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx");
  expect(s).not.toContain("text-on-primary");
  expect(s).toContain('New email campaign');
  expect(s).toContain('min-h-11');
 });
});
