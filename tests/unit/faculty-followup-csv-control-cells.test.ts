import {expect,it} from "vitest";
import {facultyFollowUpPageCsv} from "@/modules/courses/faculty-followup-export";
it("strips controls and neutralizes formula-looking follow-up titles",()=>{
 const csv=facultyFollowUpPageCsv([{kind:"QUIZ",title:"\u0000=cmd",courseName:"Hello\r\nWorld",sectionName:"=SUM(1)",dueAt:null,missingCount:1,hiddenCount:0}]);
 expect(csv).toContain('"\'=cmd"');
 expect(csv).toContain('"Hello  World"');
 expect(csv).toContain('"\'=SUM(1)"');
 expect(csv).not.toContain("\u0000");
});
