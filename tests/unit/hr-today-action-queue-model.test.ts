import {expect,it} from "vitest";
import {buildRecruiterActionQueue} from "@/modules/placements/hr-today-action-queue-model";
const uuid="11111111-1111-4111-8111-111111111111";
it("filters foreign-company and foreign-college drives before constructing review links",()=>{
 const job={id:uuid,title:"Engineer",status:"PUBLISHED",archivedAt:null};
 const rows=buildRecruiterActionQueue({jobs:[
 {collegeId:"college-a",companyId:"company-a",job},
 {collegeId:"college-b",companyId:"company-a",job},
 {collegeId:"college-a",companyId:"company-b",job}],collegeId:"college-a",companyId:"company-a",unread:1});
 expect(rows).toHaveLength(2);
 expect(rows[0]?.href).toContain("review=1");
 expect(rows[1]?.href).toContain("/recruiter/messages");
});
