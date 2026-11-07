import { describe, expect, it } from "vitest";
import { safeMetadataCsvCell } from "@/modules/shared/metadata-export-csv-cell";
import { announcementHistoryCsv } from "@/modules/announcements/admin-csv-model";
import { auditFindingsCsv } from "@/modules/bug-tracker/audit-findings-csv-model";
import { facultyReportCsv, facultyReportCsvFilename, facultyReportCsvNoticeRow, neutralizeFacultyCsvCell } from "@/modules/courses/faculty-report-csv";
import { messagingHistoryCsv } from "@/modules/messaging/receipt-history-export-model";

const at = new Date("2026-11-07T12:00:00Z");
const announcement = {
  id: "123e4567-e89b-42d3-a456-426614174000", receiverType: "COLLEGE",
  title: "Placement updates", createdAt: at, scheduledAt: null,
  expiresAt: null, deletedAt: null, isPinned: false, version: 2,
};
const finding = {
  publicId: "BUG-100", status: "NEW", severity: "HIGH", environment: "PROD",
  issueType: "UI", page: "/learn", createdAt: at,
};
const messaging = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  purpose: "Reminder", total: 8, queued: 1, sent: 4, failed: 1, suppressed: 2,
  createdAt: at, finalizedAt: null,
};

describe("UX-G169 and UX-G171: metadata CSV downloads", () => {
  it.each([
    "\\u034F=HYPERLINK(1)", "\\u200D+SUM(A1:A2)", "\\u00A0@IMPORT(1)",
    "\\u0085-1+1", "\\u2028=cmd", "\\r\\n=cmd",
  ].map(x=>x.replaceAll("\\u034F","\u034F").replaceAll("\\u200D","\u200D").replaceAll("\\u00A0","\u00A0")
    .replaceAll("\\u0085","\u0085").replaceAll("\\u2028","\u2028").replaceAll("\\r","\r").replaceAll("\\n","\n")))(
    "neutralizes Unicode/line-break formula prefix %j without adding a forged row", payload => {
      const cell = safeMetadataCsvCell(payload);
      expect(cell.startsWith("\"'")).toBe(true);
      expect(cell).not.toContain("\r");
      expect(cell).not.toContain("\n");
      expect(cell).toContain(payload.replace(/[\r\n\t\u0085\u2028\u2029]/g, " "));
    },
  );
  it("preserves ordinary human copy and doubles embedded quotes", () => {
    expect(safeMetadataCsvCell('Alice, "The Graduate"')).toBe('"Alice, ""The Graduate"""');
    expect(safeMetadataCsvCell(250)).toBe('"250"');
    expect(safeMetadataCsvCell("José, 张三")).toBe('"José, 张三"');
  });
  it("announcements retain UTC labels, 50-row cap, private-field exclusion and UTF-8 BOM", () => {
    const csv=announcementHistoryCsv(
      Array.from({length:52}, (_,i)=>({...announcement,title:i===0?"\u200D=HYPERLINK(1)\r\nnew row":"Notice "+i})),
      at.valueOf(),
    );
    expect(csv.startsWith("\uFEFF\"Notice ID\"")).toBe(true);
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(51);
    expect(csv).toContain("'‍=HYPERLINK(1)  new row");
    expect(csv).toContain("Created (UTC)");
    expect(csv).not.toMatch(/sender email|message body|recipient phone/i);
  });
  it("audit findings preserve seven labeled fields and prevent inserted rows", () => {
    const csv=auditFindingsCsv([{...finding,page:"\u034F+SUM(2)\r\nFake finding"}]);
    expect(csv.startsWith("\uFEFF\"Finding ID\"")).toBe(true);
    expect(csv.trimEnd().split("\r\n")).toHaveLength(2);
    expect(csv).toContain("'͏+SUM(2)  Fake finding");
    expect(csv).not.toMatch(/reporter email|attachment key|private note/i);
    expect(auditFindingsCsv(Array.from({length:51},()=>finding)).trimEnd().split("\r\n")).toHaveLength(51);
  });
});

describe("UX-G174 faculty assessment export", () => {
  it("neutralizes combining mark and nonbreaking whitespace before formulas", () => {
    for (const value of ["\u034F=HYPERLINK(1)","\u0301+SUM(1)","\u00A0@IMPORT(1)","\u2028-1+1"]) {
      expect(neutralizeFacultyCsvCell(value)).toBe("'"+value);
    }
    expect(neutralizeFacultyCsvCell(-5)).toBe("-5"); // trusted numeric data
    expect(neutralizeFacultyCsvCell("Learner A")).toBe("Learner A");
  });
  it("keeps accurate IST timestamp, long Unicode display names and safe filenames", () => {
    const csv=facultyReportCsv({
      kind:"assignment",title:"UX example",sectionName:"A",
      rows:[{name:"\u034F=IMPORT(1)",status:"SUBMITTED",score:"7/10",percent:70,
        submittedAt:"2026-11-07T20:00:00Z",note:"Reviewed"}],
    });
    expect(csv).toContain("2026-11-08 01:30:00 IST");
    expect(csv).toContain("'\u034F=IMPORT(1)");
    expect(csv).not.toMatch(/student_email|phone_number/i);
    expect(facultyReportCsvFilename("quiz","Java / 123","A")).toBe("faculty-quiz-report-java-123-a.csv");
  });
});

describe("UX-G174 faculty report notice row integrity", () => {
  it("keeps an omitted-rows notice in the six-column report schema", () => {
    expect(facultyReportCsvNoticeRow(null)).toBe("");
    expect(facultyReportCsvNoticeRow("70 additional learners were omitted"))
      .toBe('"70 additional learners were omitted","","","","",""\r\n');
    const notice = facultyReportCsvNoticeRow("70 additional learners, 500-row limit");
    expect(notice).toBe('"70 additional learners, 500-row limit","","","","",""\r\n');
  });
  it("quotes and neutralizes potentially unsafe notice copy", () => {
    const notice = facultyReportCsvNoticeRow('=IMPORTXML("remote")');
    expect(notice).toBe('"\'=IMPORTXML(""remote"")","","","","",""\r\n');
  });
});

describe("UX-G177 messaging history spreadsheet", () => {
  it("opens as UTF-8 and uses a uniform nine-column header, data, and report summary", () => {
    const csv=messagingHistoryCsv([{...messaging,purpose:"Placement updates"}],8);
    const lines=csv.trimEnd().replace(/^\uFEFF/,"").split("\r\n");
    expect(csv.startsWith("\uFEFF\"batch_id\"")).toBe(true);
    expect(lines).toHaveLength(3);
    // This fixture deliberately avoids commas in cell contents: delimiters are actual columns.
    expect(lines.every(line=>line.split(",").length===9)).toBe(true);
    expect(lines[1]).toContain('"4"'); // provider accepted, not handset delivery
    expect(lines[2]).toContain('"matching_total","8"');
    expect(csv).not.toMatch(/recipient_email|recipient_phone|api_key/i);
  });
  it("keeps hidden Unicode formula protection on user-controlled purpose", () => {
    const csv=messagingHistoryCsv([{...messaging,purpose:"\u034F=HYPERLINK(1)"}],8);
    expect(csv).toContain("\"'\u034F=HYPERLINK(1)\"");
  });
});
