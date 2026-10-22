import {describe,expect,it} from "vitest";
import {tpoNonApplicantReminderBlockReason} from "@/modules/placements/tpo-remind-not-applied-model";

describe("TPO non-applicant reminder preflight",()=>{
 const now=new Date("2026-10-22T12:00:00.000Z");
 const base={status:"PUBLISHED",recordedOutside:false,applicationDeadline:new Date("2026-10-23T12:00:00.000Z")};
 it("permits an active application drive before its deadline",()=>{
  expect(tpoNonApplicantReminderBlockReason(base,now)).toBeNull();
 });
 it("excludes recorded-outside drives even while published",()=>{
  expect(tpoNonApplicantReminderBlockReason({...base,recordedOutside:true},now))
   .toBe("Outside drives do not accept applications");
 });
 it("rejects passed and exact deadlines and non-published drives",()=>{
  expect(tpoNonApplicantReminderBlockReason({...base,applicationDeadline:now},now))
   .toBe("Application deadline has passed");
  expect(tpoNonApplicantReminderBlockReason({...base,applicationDeadline:new Date(now.getTime()-1)},now))
   .toBe("Application deadline has passed");
  expect(tpoNonApplicantReminderBlockReason({...base,status:"CLOSED"},now))
   .toBe("Drive is not published");
 });
});
