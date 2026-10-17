import {describe,it,expect} from "vitest";
import {summarizeTpoCalendarNeeds} from "../../src/modules/placements/tpo-calendar-needs-model";
import {toTpoBlockedCalendarEvents} from "../../src/modules/placements/tpo-blocked-calendar-model";
import type {PlacementCalendarEvent} from "../../src/modules/placements/placement-calendar-model";
const baseline=(id:string,kind:PlacementCalendarEvent["kind"],when:string,status="OPEN"):PlacementCalendarEvent=>({
 id,kind,startsAt:new Date(when),title:id,companyId:null,companyName:"Test",
 jobId:null,jobTitle:null,roundId:null,roundKind:null,leadId:null,followupId:null,
 status,timezone:null,venue:null,note:null,completedAt:null,
});
describe("TPO needs doing shortcuts",()=>{
 it("TPO-calendar-reports-10 counts only overdue open follow-ups and rounds on blocked days",()=>{
  const events=[baseline("f1","FOLLOW_UP","2099-01-08T12:00:00+05:30"),
   baseline("done","FOLLOW_UP","2099-01-08T13:00:00+05:30","DONE"),
   baseline("r1","ROUND","2099-01-09T09:00:00+05:30","SCHEDULED")];
  const result=summarizeTpoCalendarNeeds(events,new Set(["2099-01-09"]),new Date("2099-01-10T00:00:00+05:30"));
  expect(result.overdue.map(x=>x.id)).toEqual(["f1"]);
  expect(result.blockedRounds.map(x=>x.id)).toEqual(["r1"]);
 });
 it("TPO-calendar-reports-10 busy days mean at least three actual scheduled items, not exam blocks",()=>{
  const a=["a","b","c"].map((id,i)=>baseline(id,"ROUND",`2099-02-04T${String(9+i).padStart(2,"0")}:00:00+05:30`));
  const blocks=toTpoBlockedCalendarEvents([{day:"2099-02-04",reason:null}],"2099-02-04","2099-02-04");
  const result=summarizeTpoCalendarNeeds([...a,...blocks],new Set(["2099-02-04"]),new Date("2099-02-01T00:00:00Z"));
  expect(result.busyDays).toEqual([["2099-02-04",3]]);
 });
});
