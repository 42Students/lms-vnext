import {describe,it,expect} from "vitest";
import {canScheduleOnCollegeBlockedDay} from "../../src/modules/placements/tpo-blocked-day-decision";
describe("TPO blocked round scheduling",()=>{
 it("TPO-calendar-reports-02 fails closed when blocked-day ledger is unavailable",()=>{
  expect(canScheduleOnCollegeBlockedDay({storageReady:false,blocked:false,acknowledged:true})).toEqual({
   allowed:false,reason:"STORAGE_UNAVAILABLE",
  });
 });
 it("TPO-calendar-reports-02 requires explicit confirmation for a blocked exam date",()=>{
  expect(canScheduleOnCollegeBlockedDay({storageReady:true,blocked:true,acknowledged:false})).toEqual({
   allowed:false,reason:"ACK_REQUIRED",
  });
  expect(canScheduleOnCollegeBlockedDay({storageReady:true,blocked:true,acknowledged:true})).toEqual({allowed:true});
  expect(canScheduleOnCollegeBlockedDay({storageReady:true,blocked:false,acknowledged:false})).toEqual({allowed:true});
 });
});
