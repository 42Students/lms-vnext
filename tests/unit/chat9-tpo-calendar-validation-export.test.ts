import {describe,it,expect} from "vitest";
import {parseTpoCalendarUrl} from "../../src/modules/placements/tpo-calendar-url-model";
import {calendarFollowupCreateSchema} from "../../src/modules/placements/tpo-calendar-followup-model";
import {accreditationStudentCsv,buildAccreditationStudentRows} from "../../src/modules/placements/tpo-accreditation-students-model";

describe("TPO calendar scheduling and accreditation export",()=>{
 it("TPO-calendar-reports-01 accepts the blocked-only calendar filter",()=>{
   expect(parseTpoCalendarUrl({kind:"BLOCKED",view:"week"}).success).toBe(true);
   expect(parseTpoCalendarUrl({kind:"SOME_INTERNAL_CODE"}).success).toBe(false);
 });
 it("TPO-calendar-reports-08 never accepts follow-ups scheduled in the past",()=>{
   const base={leadId:"00000000-0000-4000-8000-000000000001"};
   expect(calendarFollowupCreateSchema.safeParse({...base,dueAt:"2001-01-01T10:00:00+05:30"}).success).toBe(false);
   expect(calendarFollowupCreateSchema.safeParse({...base,dueAt:"2099-01-01T10:00:00+05:30"}).success).toBe(true);
 });
 it("TPO-calendar-reports-R03 exports student records without a WARNING pseudo-row",()=>{
   const rows=buildAccreditationStudentRows([{
     membershipId:"m1",offerId:"o1",name:"Sample Learner",rollNumber:"23A",
     programme:"B.Tech",branch:"CSE",batch:"2099",company:"Acme",
     status:"ACCEPTED",annualCtcInr:600000,joining:null,kind:"OFFER",
   }]);
   const csv=accreditationStudentCsv(rows);
   expect(rows).toHaveLength(1);
   expect(csv).toContain("Sample Learner");
   expect(csv).not.toContain("WARNING");
   expect(csv.trim().split(/\r?\n/)).toHaveLength(2);
 });
});