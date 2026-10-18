import {describe,expect,it} from "vitest";
import {exportClassTeamsCsv} from "@/modules/projects/class-team-csv-export";
import {projectWorkspaceCsvCell} from "@/modules/projects/admin-workspace-page-export-model";
import {
  safeReportCsvCell,safeReportTsvCell,
} from "@/components/placements/report-interactive-table-export-model";
import {messagingHistoryCsv} from "@/modules/messaging/receipt-history-export-model";
import {requestRowsTsv,type TpoRequestClipboardRow} from "@/components/placements/tpo-request-page-clipboard";

const id="11111111-1111-4111-8111-111111111111";
const clipboardRow:TpoRequestClipboardRow={
 id,student:"Ananya",number:"IITD-42",kind:"Verification",
 company:"Employer",asked:"2026-10-18",status:"PENDING",decided:null,
};
const history={
 id,purpose:"",total:1,queued:0,sent:1,failed:0,suppressed:0,
 createdAt:new Date("2026-10-18T10:00:00Z"),finalizedAt:null,
};

describe("HR/PROJ-CSV-UNICODE-03: combining-mark prefix is unsafe across every exported screen",()=>{
 it.each(["\u034F=HYPERLINK(1)","\u0301+SUM(1,2)","\u20DD@IMPORT(1)"])(
  "neutralizes spreadsheet interpreter-ignorable mark %j",payload=>{
   expect(exportClassTeamsCsv([{name:payload,membershipIds:[id]}],new Map()))
    .toContain("\"'"+payload+"\"");
   expect(projectWorkspaceCsvCell(payload)).toBe("\"'"+payload+"\"");
   expect(safeReportCsvCell(payload)).toBe("\"'"+payload+"\"");
   expect(messagingHistoryCsv([{...history,purpose:payload}],1))
    .toContain("\"'"+payload+"\"");
   const request=requestRowsTsv([{...clipboardRow,student:payload}],["student"]);
   expect(request.split("\n")[1]).toBe("'"+payload);
  },
 );
 it("does not allow Unicode NEL or vertical tab to forge a report clipboard row",()=>{
  const payload="\u0085=HYPERLINK(1)\u000bINJECT";
  const cell=safeReportTsvCell(payload);
  expect(cell).toBe("' =HYPERLINK(1) INJECT");
  expect(cell).not.toMatch(/[\u0000-\u001f\u007f-\u009f]/);
 });
 it("preserves ordinary negative numeric totals and literal nonformula marks",()=>{
  expect(safeReportCsvCell(-25)).toBe('"-25"');
  expect(projectWorkspaceCsvCell(-25)).toBe('"-25"');
  expect(projectWorkspaceCsvCell("-25")).toBe('"\'-25"');
  expect(safeReportCsvCell("Team\u0301 A")).toBe('"Team\u0301 A"');
 });
});
