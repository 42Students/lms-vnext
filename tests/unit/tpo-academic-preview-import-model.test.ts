import {expect,it} from "vitest";
import {parseTpoAcademicPreviewCsv,previewTpoAcademicPageMatches} from "@/modules/placements/tpo-academic-preview-import-model";
const id="11111111-1111-4111-8111-111111111111";
it("validates academic CSV and matches only IDs from authorized current page",()=>{
 const rows=parseTpoAcademicPreviewCsv("studentCode,cgpa,activeBacklogs\n"+id+",8.7,2");
 expect(rows).toHaveLength(1);expect(rows[0].cgpa).toBe(8.7);
 expect(previewTpoAcademicPageMatches(rows,[id])[0].matchedOnCurrentPage).toBe(true);
 expect(previewTpoAcademicPageMatches(rows,[])[0].matchedOnCurrentPage).toBe(false);
});
it("rejects unsafe formats, duplicates, out-of-range CGPA and negative backlog counts",()=>{
 expect(()=>parseTpoAcademicPreviewCsv("studentCode,cgpa,activeBacklogs\n"+id+",11,0")).toThrow();
 expect(()=>parseTpoAcademicPreviewCsv("studentCode,cgpa,activeBacklogs\n"+id+",9,-1")).toThrow();
 expect(()=>parseTpoAcademicPreviewCsv("studentCode,cgpa,activeBacklogs\n"+id+",9,1\n"+id+",8,2")).toThrow(/Duplicate/);
});
