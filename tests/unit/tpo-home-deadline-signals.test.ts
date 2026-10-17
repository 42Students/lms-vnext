import {describe,expect,it} from "vitest";
import {deadlineTpoHomeNeeds} from "@/modules/placements/tpo-home-deadline-signals";
const make=(status:string,applicationDeadline:Date|null)=>({
 id:"uuid",title:"Engineer",status,applicationDeadline,company:{name:"Example"}});
describe("TPO-home-14 IST urgency (partial signal family)",()=>{
 const now=new Date("2026-10-16T05:30:00Z"); // 11:00 IST
 it("distinguishes deadline today, closing in 1-3 calendar days and no deadline",()=>{
  const signals=deadlineTpoHomeNeeds([
   make("PUBLISHED",new Date("2026-10-16T17:59:00Z")),
   make("PUBLISHED",new Date("2026-10-19T17:59:00Z")),
   make("PUBLISHED",null),
  ],now);
  expect(signals.map(s=>s.type)).toEqual(["DEADLINE_TODAY","CLOSING_SOON","NO_DEADLINE"]);
 });
 it("never flags expired deadlines or draft drives",()=>{
  expect(deadlineTpoHomeNeeds([make("PUBLISHED",new Date("2026-10-15T08:00:00Z")),
   make("DRAFT",null)],now)).toEqual([]);
 });
 it("does not use UTC day boundaries for India",()=>{
  expect(deadlineTpoHomeNeeds([make("PUBLISHED",new Date("2026-10-16T19:00:00Z"))],now)[0]?.type)
   .toBe("CLOSING_SOON");
 });
});
