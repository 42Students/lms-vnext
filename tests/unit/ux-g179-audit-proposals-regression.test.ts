import {describe,expect,it} from "vitest";
import {tpoCompanyShareAuditCsv} from "@/modules/placements/company-share/audit-csv-model";
import {hrDriveProposalHistoryCsv} from "@/modules/placements/hr-drive-proposal-export-model";
import {companyShareCsvResponseHeaders} from "@/modules/placements/company-share/export-headers-model";

const unsafe="\u093E=HYPERLINK(1,2)";

describe("UX-G179: safe, understandable company-share and recruiter-proposal exports",()=>{
  it("neutralizes an invisible Unicode spacing mark before a formula in share audit",()=>{
    const csv=tpoCompanyShareAuditCsv([{
      sharePrefix:unsafe,kind:"Page view",at:"2026-11-08T08:00:00Z",
    }],false);
    expect(csv).toContain('"\''+unsafe+'"');
    expect(csv).not.toContain('"'+unsafe+'"');
    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).not.toContain("secret");
  });
  it("makes the 500-event truncation notice the first row of the scoped audit",()=>{
    const csv=tpoCompanyShareAuditCsv([
      {sharePrefix:"safe",kind:"Access",at:"2026-11-08T08:00:00Z"},
    ],true);
    expect(csv.split("\r\n")[1]).toContain('"NOTICE"');
    expect(csv.split("\r\n")).toHaveLength(3);
  });
  it("exports proposal metadata with a UTF-8 BOM and correct four-field header",()=>{
    const csv=hrDriveProposalHistoryCsv([{
      referenceId:"proposal-1",title:unsafe,
      createdAt:new Date("2026-11-08T08:00:00.000Z"),
    }]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"\''+unsafe+'"');
    expect(csv).toContain('"proposal_reference","role_title","sent_at_utc","status"');
    expect(csv).toContain('"DISCUSSION_ONLY"');
    expect(csv).not.toContain("candidate phone");
  });
  it("keeps an empty proposal history an understandable header-only CSV",()=>{
    const csv=hrDriveProposalHistoryCsv([]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.split("\r\n")).toHaveLength(2);
  });
  it("preserves privacy-safe download response headers for capability links",()=>{
    const headers=companyShareCsvResponseHeaders();
    expect(headers["Cache-Control"]).toContain("no-store");
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Robots-Tag"]).toContain("noindex");
  });
});
