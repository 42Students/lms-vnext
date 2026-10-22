import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync("src/components/tpo/tpo-company-memory-workspace.tsx","utf8");
const grid=readFileSync("src/components/tpo/tpo-company-memory-drive-grid.tsx","utf8");
describe("TPO Company Memory legacy parity",()=>{
 it("TPO-companies-09 maps stored placement status to readable legacy labels",()=>{
  for(const label of ['PUBLISHED:"Live"','CLOSED:"Completed"','DRAFT:"Draft"',
   'REQUEST:"Sent for review"','CANCELLED:"Cancelled"'])
   expect(grid).toContain(label);
  expect(grid).toContain("statusLabel(drive.status)");
 });
 it("TPO-companies-21 never exposes DB migration identifiers or raw not-found jargon",()=>{
  expect(source).toContain('phase: "not-found", message: "Company not found"');
  expect(source).toContain('response.status === 404');
  expect(source).not.toContain("DB09 database verification");
  expect(source).toContain('Company details are temporarily unavailable while placement data storage is being prepared. Try again.');
  expect(source).toContain(">Retry</Button>");
  expect(source).toContain('phase === "migration-pending"');
  expect(source).toContain("Students-placed counts are unavailable for this college");
  expect(source).not.toContain("until W04 verifies");
 });
 it("TPO-companies-22 labels the company numbers strip and does not misrepresent empty activity",()=>{
  expect(source).toContain('aria-label="Company numbers"');
  expect(source).toContain('"no activity yet"');
  expect(source).toContain('["students placed"');
 });
 it("TPO-companies-23 shows actor, activity type and optional note together",()=>{
  expect(source).toContain('item.type.toLowerCase()}{item.note?": "+item.note:""}');
  expect(source).toContain("legacyActivityTime(item.createdAt)");
  expect(source).toContain("legacyActivityDay(latest.createdAt)");
  expect(source).toContain('month:"short",hour:"numeric",minute:"2-digit",hour12:true');
 });
});
