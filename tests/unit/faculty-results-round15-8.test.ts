import {it,expect} from "vitest";
import {facultyResultsPageCsv,facultyResultsCsvHref} from "@/modules/courses/faculty-results-export";
import {facultyResultsQuerySchema} from "@/modules/courses/faculty-results-model";
it("exports only bounded aggregated results and neutralizes spreadsheet formulae",()=>{
 const csv=facultyResultsPageCsv([{kind:"QUIZ",status:"PUBLISHED",title:"=1+1",courseName:"CS",sectionName:"A",eligible:2,responded:1,pending:1,averagePercent:null}]);
 expect(csv).toContain("'=1+1");
 expect(csv).toContain("Unknown");
 expect(csv).not.toContain("email");
 expect(facultyResultsCsvHref(facultyResultsQuerySchema.parse({page:2,pageSize:10}))).toContain("page=2");
 expect(()=>facultyResultsPageCsv(Array.from({length:11},()=>({kind:"QUIZ",status:"PUBLISHED",title:"A",courseName:"C",sectionName:"S",eligible:0,responded:0,pending:0,averagePercent:null})))).toThrow();
});
