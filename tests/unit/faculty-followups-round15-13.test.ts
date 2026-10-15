import {it,expect} from "vitest";
import {facultyFollowUpPageCsv,facultyFollowUpCsvHref} from "@/modules/courses/faculty-followup-export";
import {facultyResponseFollowUpQuerySchema} from "@/modules/courses/faculty-response-followup-model";
it("produces only bounded Section-scoped count rows and escapes spreadsheet formulae",()=>{
 const row={kind:"QUIZ",title:"=1+1",courseName:"Computing",sectionName:"A",dueAt:new Date("2026-10-01"),missingCount:4,hiddenCount:1,missingPreview:[{displayName:"Private Student",rollNumber:"ABC"}]};
 const csv=facultyFollowUpPageCsv([row]);
 expect(csv).toContain("'=1+1");
 expect(csv).toContain("4");
 expect(csv).not.toContain("Private Student");
 expect(csv).not.toContain("ABC");
 expect(facultyFollowUpCsvHref(facultyResponseFollowUpQuerySchema.parse({pageSize:10,page:2}))).toContain("page=2");
 expect(()=>facultyFollowUpPageCsv(Array.from({length:11},()=>({kind:"QUIZ",title:"Test",courseName:"C",sectionName:"S",dueAt:null,missingCount:0,hiddenCount:0})))).toThrow();
});
