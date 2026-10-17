import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const file=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-3 final sprint TPO Companies company memory",()=>{
 it("TPO-companies-07 preserves the persisted legacy company memory contract",()=>{
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Students placed, by year");
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("hiredPerYear.map");
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Repeat hiring relationship");
  expect(file("src/modules/placements/tpo-company-memory-service.ts")).toContain("companyHiredByYear(driveRows)");
 });
 it("TPO-companies-08 preserves the persisted legacy company memory contract",()=>{
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Search drives");
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Export drives CSV");
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Year</th>");
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Applied</th>");
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("companyDriveCsv(visibleDrives)");
 });
 it("TPO-companies-10 preserves the persisted legacy company memory contract",()=>{
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("href={\"/tpo/placements/jobs/\" + encodeURIComponent(drive.id)}");
 });
 it("TPO-companies-11 preserves the persisted legacy company memory contract",()=>{
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Nothing shared yet.");
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Applicant list shared ");
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("href={\"/tpo/placements/jobs/\"+encodeURIComponent(doc.jobId)}");
  expect(file("src/modules/placements/tpo-company-memory-service.ts")).toContain("documents: shareHistory.items");
 });
 it("TPO-companies-12 preserves the persisted legacy company memory contract",()=>{
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Invite sent, not opened");
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Joined · has not signed in yet");
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Drive planned");
  expect(file("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Invite bounced");
 });
});
