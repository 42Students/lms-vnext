import {expect,it} from "vitest";
import {serializeTpoLiveDriveDayCsv,tpoLiveCsvHref} from "@/modules/placements/tpo-live-drive-day-csv-model";
it("exports only passed live rounds without any learner PII and escapes formulas",()=>{
 const csv=serializeTpoLiveDriveDayCsv([{id:"round-1",companyName:"=IMPORTXML()",jobTitle:"Engineer",name:'A "B"',scheduledAt:null,durationMinutes:30,counts:{total:3,checkedIn:1,noShow:0,pending:1,unknown:1}}]);
 expect(csv).toContain('"\'=IMPORTXML()"');
 expect(csv).toContain('"A ""B"""');
 expect(csv).not.toContain("Learner");
 expect(csv).toContain('"Unrecorded"');
});
it("keeps user filters but does not allow caller-specified college IDs",()=>{
 const url=tpoLiveCsvHref({q:"Data Analyst",issue:"UNRESOLVED",sort:"UNRESOLVED_DESC"});
 expect(url).toContain("q=Data+Analyst");
 expect(url).toContain("issue=UNRESOLVED");
 expect(url).not.toContain("collegeId=");
});
