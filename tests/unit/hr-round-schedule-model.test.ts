import {describe,expect,it} from "vitest";
import {hrScheduledRoundRows,type RoundScheduleRow} from "@/modules/placements/hr-round-schedule-model";
function round(id:string,offset:number,durationMinutes:number|null):RoundScheduleRow{
 return {id,name:id,sequence:offset,status:"SCHEDULED",
 scheduledAt:new Date(Date.UTC(2026,9,20,10,offset)),durationMinutes,mode:"VIRTUAL",venue:null};
}
describe("Recruiter round schedule",()=>{
 it("detects a true interval overlap without flagging adjacent intervals",()=>{
  const rows=hrScheduledRoundRows([round("a",0,60),round("b",30,30),round("c",60,20)]);
  expect(rows.find(x=>x.id==="a")?.conflicts).toEqual(["b"]);
  expect(rows.find(x=>x.id==="c")?.conflicts).toEqual([]);
 });
 it("does not invent an end time or conflict when duration is unknown",()=>{
  const rows=hrScheduledRoundRows([round("a",0,null),round("b",20,30)]);
  expect(rows.find(x=>x.id==="a")?.endsAt).toBeNull();
  expect(rows.find(x=>x.id==="b")?.conflicts).toEqual([]);
 });
});
