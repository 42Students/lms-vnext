import {describe,expect,it} from "vitest";
import {
  projectWorkspaceCsvCell,projectWorkspacePageCsv,
} from "@/modules/projects/admin-workspace-page-export-model";

const date=new Date("2026-10-18T18:45:00.000Z");

describe("PROJ-BREAK-EXPORT-01: Project workspace visible-page CSV safety and scope",()=>{
 it.each([
  "=HYPERLINK(\"https://host.invalid\")",
  "\uFEFF+SUM(A1:A3)",
  "\u200B@attacker",
  "\u2029-SUM(A1:A3)",
  "\t=cmd",
  "\r\n=cmd",
 ])("neutralizes Unicode and control-prefix formula cells %j",input=>{
  expect(projectWorkspaceCsvCell(input).startsWith('"\'')).toBe(true);
  expect(projectWorkspaceCsvCell(input)).toContain(input.replaceAll('"','""'));
 });
 it("preserves numeric negative or zero values without turning them into literal text",()=>{
  expect(projectWorkspaceCsvCell(-1)).toBe('"-1"');
  expect(projectWorkspaceCsvCell(-25.5)).toBe('"-25.5"');
  expect(projectWorkspaceCsvCell(0)).toBe('"0"');
  expect(projectWorkspaceCsvCell("-1")).toBe('"\'-1"');
  expect(projectWorkspaceCsvCell("-25.5")).toBe('"\'-25.5"');
 });
 it("exports only supplied, authorized page rows with original order and quoted titles",()=>{
  const csv=projectWorkspacePageCsv([{
   title:'=IMPORTRANGE("secret","A:B")',mentorName:'A,"B"',
   status:"ACTIVE",riskReasons:["Active blocker"],progressPercent:45,
   memberCount:2,updatedAt:date,
  }]);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  const withoutBom=csv.slice(1);
  expect(withoutBom.split("\r\n")).toHaveLength(3);
  expect(withoutBom).toContain('"\'=IMPORTRANGE(""secret"",""A:B"")"');
  expect(withoutBom).toContain('"A,""B"""');
  expect(withoutBom).toContain('"Blocked"');
  expect(withoutBom).toContain('"45","2"');
  // Oct 19 in IST for 18:45 UTC. UTC date would be Oct 18.
  expect(withoutBom).toMatch(/19\/10\/26|19\/10\/2026/);
  expect(withoutBom).not.toContain("unknown college");
 });
 it("never fetches or includes hidden projects: empty authorized page exports only headings",()=>{
  const csv=projectWorkspacePageCsv([]);
  expect(csv).toContain('"Workspace","Mentor","Status","Progress %","Members","Last changed (IST)"');
  expect(csv.split("\r\n")).toHaveLength(2);
 });
});
