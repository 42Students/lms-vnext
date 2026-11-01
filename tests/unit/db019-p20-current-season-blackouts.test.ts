import {describe,expect,it} from "vitest";
import {
 legacyCurrentSeasonSelection,
 projectTpoSeasonRegistration,
 withCurrentSeasonBlockedDates,
} from "@/modules/placements/tpo-season-current-service";

describe("DB19-P20 current-season blackout projection",()=>{
 const current={id:"a",status:"ACTIVE",startDate:"2026-07-01",
  updatedAt:"2026-09-01",registrationControlled:true,
  isRegistrationOpen:true,registrationDeadline:null};
 it("shows stored college blackout dates only when registered storage is available",()=>{
  const selected=legacyCurrentSeasonSelection([current]);
  const model=projectTpoSeasonRegistration(selected.current);
  const present=withCurrentSeasonBlockedDates(model,{
   ready:true,rows:[
    {day:"2026-12-02",reason:"College exam"},
    {day:"2026-12-03",reason:"Placement blackout"},
   ],
  });
  expect(present.blockedDatesSupported).toBe(true);
  expect(present.blockedDates).toEqual([
   {date:"2026-12-02",label:"College exam"},
   {date:"2026-12-03",label:"Placement blackout"},
  ]);
  expect(present.isOpen).toBe(true);
  expect(present.requiresCohortInvitation).toBe(true);
 });
 it("does not promote a missing table to an authoritative empty calendar",()=>{
  const initial=projectTpoSeasonRegistration(current);
  const missing=withCurrentSeasonBlockedDates(initial,{
   ready:false,rows:[{day:"2026-12-02",reason:"Ignore unverified row"}],
  });
  expect(missing.blockedDatesSupported).toBe(false);
  expect(missing.blockedDates).toEqual([]);
 });
 it("no selected current season still means no date read, not an invented season",()=>{
  expect(legacyCurrentSeasonSelection([]).current).toBeNull();
  const none=projectTpoSeasonRegistration(null);
  expect(none.isOpen).toBeNull();
  expect(none.blockedDatesSupported).toBe(false);
 });
});
