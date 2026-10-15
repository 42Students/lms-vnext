import {expect,it} from "vitest";
import {serializeTpoBatchStudentViewCsv,batchStudentViewExportHref} from "@/modules/placements/tpo-batch-student-filtered-export-model";
it("exports only selected rows with neutralized spreadsheet cells and no private notes",()=>{
 const csv=serializeTpoBatchStudentViewCsv([{membershipId:"id",name:"=IMPORTXML()",decision:"INELIGIBLE",ambiguous:false,source:"BATCH",registration:{choice:null}}]);
 expect(csv).toContain('"\'=IMPORTXML()"');
 expect(csv).toContain('"BATCH"');
 expect(csv).not.toContain("Reason");
 expect(csv).not.toContain("Email");
});
it("retains selected filters without accepting an untrusted college ID",()=>{
 const href=batchStudentViewExportHref("cohort",3,{q:"A B",decision:"ELIGIBLE",source:"CLASS",registration:"RECORDED",order:"REVIEW_FIRST"});
 expect(href).toContain("page=3&q=A+B");
 expect(href).toContain("order=REVIEW_FIRST");
 expect(href).not.toContain("collegeId");
});
