import {describe,expect,it} from "vitest";
import {careerCalendarEvents,legacyJobImportantDatesToSupplements} from "@/modules/placements/learner-career-calendar-model";

describe("legacy JobImportantDateEventDTO type/label parity",()=>{
 it("keeps the authored label distinct from its typed screening and technical classification",()=>{
  const dates=legacyJobImportantDatesToSupplements({
   jobId:"job-one",roleTitle:"Intern",companyName:"Acme",
   importantDates:[
    {label:"Complete stage 1",at:"2026-10-22T09:00:00.000Z",type:"SCREENING"},
    {label:"Portfolio review",at:"2026-10-22T10:00:00.000Z",type:"TECHNICAL"},
    {label:"Apply by",at:"2026-10-22T11:00:00.000Z",type:"APPLICATION_DEADLINE"},
   ],
  });
  expect(dates).toHaveLength(3);
  expect(dates.map(row=>row.importantDateLabel)).toEqual([
   "Complete stage 1","Portfolio review","Apply by",
  ]);
  expect(dates.map(row=>row.importantDateType)).toEqual([
   "SCREENING","TECHNICAL","APPLICATION_DEADLINE",
  ]);
  const entries=careerCalendarEvents([],dates);
  expect(entries.map(row=>row.kind)).toEqual(["ASSESSMENT","INTERVIEW","OTHER"]);
  expect(entries.map(row=>row.title)).toEqual([
   "Complete stage 1","Portfolio review","Apply by",
  ]);
  expect(entries.map(row=>row.importantDateType)).toEqual([
   "SCREENING","TECHNICAL","APPLICATION_DEADLINE",
  ]);
 });
});
