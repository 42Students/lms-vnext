import {describe,expect,it} from "vitest";
import {istDateKey,nextTpoFollowupTomorrow,nextTpoTodayFollowupAt,rankTpoCompaniesToday} from
 "@/modules/placements/tpo-companies-today-model";
const row=(id:string,dueAt:string)=>({id,leadId:id,leadName:id,
 companyName:"Employer",dueAt,note:null,phoneNorm:null,canContact:false,overdue:false});
describe("Companies Today source-backed focus order",()=>{
 it("deduplicates, sorts by earliest due, preserves source facts",()=>{
  const earlier=row("early","2026-10-24T07:00:00Z");
  const later=row("late","2026-10-25T07:00:00Z");
  expect(rankTpoCompaniesToday([later,earlier],[later]).map(r=>r.id)).toEqual(["early","late"]);
  expect(rankTpoCompaniesToday([],[])).toEqual([]);
 });
 it("uses IST calendar day and exact tomorrow 10 AM",()=>{
  const lateUtc=new Date("2026-10-24T22:30:00.000Z");
  expect(istDateKey(lateUtc)).toBe("2026-10-25");
  expect(nextTpoFollowupTomorrow(lateUtc)).toBe("2026-10-26T10:00:00+05:30");
 });

 it("honors each prototype after-call option in the local college timezone",()=>{
  const now=new Date("2026-10-24T22:30:00Z");
  expect(nextTpoTodayFollowupAt("NONE",now,"")).toBeNull();
  expect(nextTpoTodayFollowupAt("TOMORROW",now,"")).toBe("2026-10-26T10:00:00+05:30");
  expect(nextTpoTodayFollowupAt("WEEK",now,"")).toBe("2026-11-01T10:00:00+05:30");
  expect(nextTpoTodayFollowupAt("CUSTOM",now,"2026-11-02T11:45")).toBe("2026-11-02T11:45:00+05:30");
 });
 it("rejects nonexistent date/time, invalid shape and past custom selections",()=>{
  const now=new Date("2026-10-24T00:00:00Z");
  for(const raw of ["2026-02-30T10:00","2026-10-23T10:00",
   "2026-10-27T24:00","2026-10-27","2026-10-25T10:00:00"]){
   expect(nextTpoTodayFollowupAt("CUSTOM",now,raw)).toBeNull();
  }
 });
});
