import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {TpoRecruiterGrantView} from "@/modules/placements/tpo-recruiter-access-model";
import {
 TPO_RECRUITER_GRANT_EXPORT_HEADERS,tpoRecruiterGrantExportRows,
 tpoRecruiterGrantCsv,tpoRecruiterGrantXlsx,tpoRecruiterGrantExportHref,
} from "@/modules/placements/tpo-recruiter-grant-export-model";

const grant:TpoRecruiterGrantView={
 displayName:'=HYPERLINK("https://attacker.example","click")',
 companyName:"Example & <Company>",designation:"Director",
 status:"ACTIVE",grantedDate:"18 Oct 2026",revokedDate:null,
 validUntilDate:null,ended:false,capabilities:["DRIVES","CANDIDATE_READ"],
 verificationStatus:"VERIFIED",
};

describe("TPO-settings-audit-60 historical recruiter grant Excel and CSV parity",()=>{
 it("preserves a single privacy-safe column projection for both formats",()=>{
  expect(TPO_RECRUITER_GRANT_EXPORT_HEADERS).toEqual([
   "Recruiter","Company","Grant status","Verification","Valid through (IST)",
   "Access capabilities","Granted (IST)","Revoked (IST)",
  ]);
  const rows=tpoRecruiterGrantExportRows([grant],false);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toHaveLength(TPO_RECRUITER_GRANT_EXPORT_HEADERS.length);
  expect(rows[0][0]).toBe(grant.displayName);
  expect(rows[0][1]).toBe(grant.companyName);
  expect(rows[0][5]).toBe("DRIVES | CANDIDATE_READ");
  expect(rows[0][4]).toBe("");
  expect(rows[0][7]).toBe("");
  expect(TPO_RECRUITER_GRANT_EXPORT_HEADERS.join("|").toLowerCase())
   .not.toMatch(/phone|email|user id|college id/);
  const csv=tpoRecruiterGrantCsv([grant],false);
  expect(csv).toContain('=HYPERLINK');
  expect(csv).toContain('"'+"'"+'=HYPERLINK');
  expect(csv).toContain('Example & <Company>');
 });
 it("emits a valid ZIP-based Office XML workbook with literal escaped text instead of formulas",async()=>{
  const workbook=tpoRecruiterGrantXlsx([grant],false);
  expect(workbook.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  const bytes=new Uint8Array(await workbook.arrayBuffer());
  expect(Array.from(bytes.slice(0,4))).toEqual([0x50,0x4b,0x03,0x04]);
  const text=new TextDecoder().decode(bytes);
  expect(text).toContain('xl/worksheets/sheet1.xml');
  expect(text).toContain('t="inlineStr"');
  expect(text).toContain('Example &amp; &lt;Company&gt;');
  expect(text).toContain('=HYPERLINK');
  expect(text).not.toContain('<f>');
  expect(text).not.toContain('<v>');
 });
 it("adds a truthful cap warning to both formats and keeps filtered links stable",async()=>{
  const data=tpoRecruiterGrantExportRows([grant],true);
  expect(data).toHaveLength(2);
  expect(data[0][0]).toBe("NOTICE");
  expect(data[0][1]).toMatch(/first 500 matching grant records/);
  const text=new TextDecoder().decode(await tpoRecruiterGrantXlsx([grant],true).arrayBuffer());
  expect(text).toContain("Only the first 500 matching grant records are included");
  expect(tpoRecruiterGrantExportHref({status:"ALL",q:""}))
   .toBe("/api/placements/tpo/settings/recruiter-grants/export");
  const link=tpoRecruiterGrantExportHref({status:"REVOKED",q:"& a"},"xlsx");
  const params=new URL(link,"https://college.example").searchParams;
  expect(params.get("format")).toBe("xlsx");
  expect(params.get("status")).toBe("REVOKED");
  expect(params.get("q")).toBe("& a");
 });
 it("does not accept ambiguous or cross-tenant URL parameter overrides",()=>{
  const route=readFileSync("src/app/api/placements/tpo/settings/recruiter-grants/export/route.ts","utf8");
  const ui=readFileSync("src/app/(authenticated)/tpo/settings/recruiters/page.tsx","utf8");
  expect(route).toContain('new Set(["status","q","format"])');
  expect(route).toContain("params.getAll(key).length!==1");
  expect(route).toContain('format!=="csv"&&format!=="xlsx"');
  expect(route).toContain("listTpoRecruiterAccess(await getCurrentRequestContext()");
  expect(route).toContain("exportAll:true");
  expect(route).toContain('filename="recruiters.csv"');
  expect(route).toContain('filename="recruiters.xlsx"');
  expect(route).toContain("private, no-store");
  expect(ui).toContain('tpoRecruiterGrantExportHref(query,"xlsx")');
 });
});
