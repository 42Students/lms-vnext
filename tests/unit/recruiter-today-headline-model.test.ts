import {describe,it,expect} from "vitest";
import {recruiterTodayHasDriveHistory,recruiterTodayHeadline} from "@/modules/placements/recruiter-today-headline-model";
describe("Recruiter Today screenshot and old-LMS first-drive/empty parity",()=>{
 it("keeps current actionable count in the screenshot headline",()=>{
  expect(recruiterTodayHeadline("Good evening, Meera",3,true))
   .toBe("Good evening, Meera. Three things need you.");
  expect(recruiterTodayHeadline("Good morning, Meera",7,true))
   .toBe("Good morning, Meera. 7 things need you.");
 });
 it("does not confuse no first drive, no work, and an unavailable history",()=>{
  expect(recruiterTodayHeadline("Good afternoon, Meera",0,false))
   .toBe("Good afternoon, Meera. Let's get your first drive going.");
  expect(recruiterTodayHeadline("Good afternoon, Meera",0,true))
   .toBe("Good afternoon, Meera. You're all caught up.");
  expect(recruiterTodayHeadline("Good afternoon, Meera",0,null))
   .toBe("Good afternoon, Meera.");
 });
 it("does not mark deferred, unresolved work as all caught up",()=>{
  expect(recruiterTodayHeadline("Good evening, Meera",0,true,1))
   .toBe("Good evening, Meera. 1 thing is put off for later.");
  expect(recruiterTodayHeadline("Good evening, Meera",0,true,3))
   .toBe("Good evening, Meera. 3 things are put off for later.");
 });
 it("knows verified published jobs remain history if secondary requests fail",()=>{
  expect(recruiterTodayHasDriveHistory({verifiedJobCount:1,requestCount:null,jobPreviewCapped:false})).toBe(true);
  expect(recruiterTodayHasDriveHistory({verifiedJobCount:0,requestCount:0,jobPreviewCapped:true})).toBe(true);
  expect(recruiterTodayHasDriveHistory({verifiedJobCount:0,requestCount:null,jobPreviewCapped:false})).toBeNull();
  expect(recruiterTodayHasDriveHistory({verifiedJobCount:0,requestCount:0,jobPreviewCapped:false})).toBe(false);
  expect(recruiterTodayHasDriveHistory({verifiedJobCount:0,requestCount:1,jobPreviewCapped:false})).toBe(true);
 });
});
