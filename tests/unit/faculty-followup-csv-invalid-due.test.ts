import {expect,it} from "vitest";
import {facultyFollowUpPageCsv} from "@/modules/courses/faculty-followup-export";
it("exports unknown instead of crashing on malformed due dates",()=>{
 const csv=facultyFollowUpPageCsv([{kind:"QUIZ",title:"Final",courseName:"Java",sectionName:"A",dueAt:new Date(Number.NaN),missingCount:0,hiddenCount:0}]);
 expect(csv).toContain('"Unknown"');
 expect(csv).not.toContain('Invalid Date');
});
