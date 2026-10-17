import {describe,it,expect} from "vitest";
import {tpoLegacyCalendarEventTitle,TPO_CALENDAR_SUBTITLE,TPO_EMPTY_AGENDA} from "../../src/modules/placements/tpo-calendar-display-model";
describe("TPO calendar legacy labels",()=>{
 it("TPO-calendar-reports-16 displays company round and deadline labels from the legacy calendar",()=>{
   expect(tpoLegacyCalendarEventTitle({kind:"ROUND",title:"Screening",companyName:"Example Co"})).toBe("Example Co · Screening");
   expect(tpoLegacyCalendarEventTitle({kind:"APPLICATION_DEADLINE",title:"Application deadline: Job",companyName:"Example Co"})).toBe("Deadline: Example Co");
   expect(tpoLegacyCalendarEventTitle({kind:"FOLLOW_UP",title:"Follow up: Recruiter",companyName:"Example Co"})).toBe("Follow up: Recruiter");
 });
 it("TPO-calendar-reports-17 preserves the exact legacy calendar subtitle",()=>{
   expect(TPO_CALENDAR_SUBTITLE).toBe("Coordinate rounds, talks, deadlines and recruiter follow-ups without losing the wider placement schedule.");
 });
 it("TPO-calendar-reports-18 uses the legacy empty agenda wording",()=>{
   expect(TPO_EMPTY_AGENDA).toBe("Nothing scheduled in this period");
 });
});