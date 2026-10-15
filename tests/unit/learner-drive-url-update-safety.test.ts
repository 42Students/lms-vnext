import { describe,expect,it } from "vitest";
import {learnerDriveQueryWithChanges,readLearnerDriveUrl} from "@/modules/placements/learner-drive-url-model";
describe("learner drive URL update sanitation",()=>{
 it("keeps only valid single-valued saved filters",()=>{
   const href=learnerDriveQueryWithChanges("q=Cloud&sort=not-real&loc=Delhi&loc=Foreign&collegeId=other&page=19",{eligible:"1"});
   expect(href).toContain("q=Cloud");
   expect(href).toContain("eligible=1");
   expect(href).not.toMatch(/collegeId|sort=not-real|loc=|page=/);
 });
 it("invalid changed filter cannot poison valid search and availability",()=>{
   const href=learnerDriveQueryWithChanges("q=Cloud&availability=open",{sort:"invalid",soon:"true"});
   expect(readLearnerDriveUrl(href)).toMatchObject({filters:{search:"Cloud",availability:"open",sort:"deadline",closingSoon:false}});
 });
});