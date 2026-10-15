import {expect,it} from "vitest";
import {facultyFollowUpPageCsv} from "@/modules/courses/faculty-followup-export";
it("rejects corrupt follow-up counts rather than exporting false totals",()=>{
 const row={kind:"ASSIGNMENT",title:"Final",courseName:"Java",sectionName:"A",dueAt:null,missingCount:3,hiddenCount:2};
 expect(facultyFollowUpPageCsv([row])).toContain('"3"');
 for(const patch of [{missingCount:-1},{hiddenCount:4},{missingCount:NaN},{hiddenCount:1.5}]){
  expect(()=>facultyFollowUpPageCsv([{...row,...patch}])).toThrow("INVALID_FOLLOWUP_CSV_COUNTS");
 }
});
