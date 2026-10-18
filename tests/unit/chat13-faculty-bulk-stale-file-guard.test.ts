import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {canSubmitFacultyBulkImport} from "@/modules/people/faculty-bulk-import-submit-guard";

const ready={
  busy:false,count:2,issue:"",error:"",filename:"faculty.csv",
  snapshotVersion:4,currentVersion:4,
};
describe("SA-FACULTY-CSV-17 prevent stale bulk onboarding after replacement file",()=>{
 it("allows only a currently validated and named CSV",()=>{
   expect(canSubmitFacultyBulkImport(ready)).toBe(true);
   for(const candidate of [
     {...ready,filename:"faculty.txt"},
     {...ready,filename:""},
     {...ready,error:"Choose a .csv faculty file."},
     {...ready,issue:"Invalid row"},
     {...ready,count:0},
     {...ready,count:501},
     {...ready,count:NaN},
     {...ready,busy:true},
     {...ready,snapshotVersion:3},
     {...ready,currentVersion:5},
   ])expect(canSubmitFacultyBulkImport(candidate)).toBe(false);
 });
 it("guards against invalid replacement files, out-of-order File.text and double confirm",()=>{
   const view=readFileSync("src/components/admin/super-admin-faculty-bulk-import.tsx","utf8");
   expect(view).toContain("const version=++fileVersion.current");
   expect(view).toContain('setCsv("");setResults([]);setError("");setFilename(file?.name??"")');
   expect(view).toContain("if(version===fileVersion.current)setCsv(text)");
   expect(view).toContain('if(version===fileVersion.current)setError("Could not read the CSV file.")');
   expect(view).toContain("if(submissionInProgress.current)return");
   expect(view).toContain("submissionInProgress.current=true");
   expect(view).toContain("submissionInProgress.current=false");
   expect(view).toContain("||!allowed())return");
   expect(view).toContain("body:JSON.stringify({collegeId,csv:inputCsv,confirmed:true})");
   expect(view).toContain("Boolean(issue||error)||!filename");
 });
});
