import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync("src/components/tpo/tpo-company-memory-workspace.tsx","utf8");
describe("TPO Company Memory legacy parity",()=>{
 it("TPO-companies-09 maps stored placement status to readable legacy labels",()=>{
  for(const label of ['PUBLISHED:"Live"','CLOSED:"Completed"','DRAFT:"Draft"',
   'REQUEST:"Sent for review"','CANCELLED:"Cancelled"'])
   expect(source).toContain(label);
  expect(source).toContain("statusLabel(drive.status)");
 });
 it("TPO-companies-21 never exposes DB migration identifiers or raw not-found jargon",()=>{
  expect(source).toContain('error: "Company not found"');
  expect(source).not.toContain("DB09 database verification");
  expect(source).toContain('Company details are unavailable right now. Try again.');
  expect(source).toContain(">Retry</button>");
 });
 it("TPO-companies-22 labels the company numbers strip and does not misrepresent empty activity",()=>{
  expect(source).toContain('aria-label="Company numbers"');
  expect(source).toContain('"no activity yet"');
  expect(source).toContain('["students placed"');
 });
 it("TPO-companies-23 shows actor, activity type and optional note together",()=>{
  expect(source).toContain('item.type.toLowerCase()}{item.note?": "+item.note:""}');
  expect(source).toContain('dateLabel(item.createdAt)');
 });
});
