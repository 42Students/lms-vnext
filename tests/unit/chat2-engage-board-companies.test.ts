import {describe,expect,it} from "vitest";
import {recruiterBoardColumn,shouldRenderCompaniesView} from "@/modules/placements/recruiter-board-view-model";
describe("TPO-recruiters-04 TPO-recruiters-R02 board and Companies visibility",()=>{
 it("never hides Companies because lead filters are empty",()=>{
  expect(shouldRenderCompaniesView("companies",0)).toBe(true);
  expect(shouldRenderCompaniesView("table",0)).toBe(false);
 });
 it("uses derived stage, with a bounded card count",()=>{
  const joined={stage:"JOINED" as const},newLead={stage:"NEW" as const};
  expect(recruiterBoardColumn([joined,newLead],"JOINED")).toEqual({total:1,visible:[joined]});
  expect(recruiterBoardColumn(Array.from({length:51},()=>newLead),"NEW").visible).toHaveLength(50);
 });
});
