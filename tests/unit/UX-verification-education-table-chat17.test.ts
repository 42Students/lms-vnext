import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { verificationEducationRows } from "@/modules/verification/education-rows";

describe("UX-UNOWNED-TABLE-06 private verification education grid",()=>{
  it("displays only five bounded, permitted fields with legacy fallback copy",()=>{
    const rows=verificationEducationRows([
      null,42,[],{
        educationType:"B.Tech",institutionName:"",institution:"Institute A",
        endYear:"2026",grade:"9.1",marksheetDocumentId:"receipt-uuid",
        identityNumber:"NEVER_SHOW",studentPassword:"NEVER_SHOW",internalDocument:"NEVER_SHOW",
      },{educationType:"School",institutionName:"School B",endYear:"2022",grade:"92%"},
      {educationType:"L".repeat(250),institutionName: ["wrong"],grade:0,marksheetDocumentId:8},
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      id:"3",level:"B.Tech",institution:"Institute A",year:"2026",
      marks:"9.1",marksheet:"Submitted",
    });
    expect(rows[1]).toEqual({
      id:"4",level:"School",institution:"School B",year:"2022",
      marks:"92%",marksheet:"Missing",
    });
    expect(rows[2]).toMatchObject({id:"5",institution:"—",year:"—",marks:"0",marksheet:"Missing"});
    expect(rows[2]!.level).toHaveLength(200);
    expect(JSON.stringify(rows)).not.toContain("NEVER_SHOW");
    expect(verificationEducationRows({arbitrary:"object"})).toEqual([]);
  });

  it("uses the reusable phone-accessible DataTable but leaves private document links guarded",()=>{
    const source=readFileSync(join(process.cwd(),
      "src/components/verification/VerificationReviewDrawer.tsx"),"utf8");
    expect(source.startsWith('"use client";')).toBe(true);
    expect(source).toContain('import { DataTable } from "@/components/ui/data-table"');
    expect(source).toContain('caption="Submitted education records"');
    expect(source).toContain('verificationEducationRows(detail.review.submittedSnapshot["education"])');
    for(const col of ["Level","Institution","Year","Marks","Marksheet"])
      expect(source).toContain('header:"'+col+'"');
    expect(source).toContain('Open {doc.purpose==="RESUME"?"resume":doc.purpose==="MARKSHEET"?"marksheet":"document"} (private signed link)');
    expect(source).not.toMatch(/<\s*table\b/i);
    expect(source).not.toMatch(/<\s*(thead|tbody|tr|td)\b/i);
  });
});
