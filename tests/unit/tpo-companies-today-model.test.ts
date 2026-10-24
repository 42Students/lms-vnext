import {describe,expect,it} from "vitest";
import {istDateKey,nextTpoFollowupTomorrow,rankTpoCompaniesToday} from
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
});
