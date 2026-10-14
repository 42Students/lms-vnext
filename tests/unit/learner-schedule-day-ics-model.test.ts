import {describe,expect,it} from "vitest";
import {learnerScheduleDayIcs} from "@/modules/academics/learner-schedule-day-ics-model";
const event={id:"11111111-1111-4111-8111-111111111111",title:"Lab, Week 2",
 startsAt:"2026-10-14T19:00:00.000Z",endsAt:"2026-10-14T20:00:00.000Z",
 location:"Room 2",description:"Line one\nATTENDEE:danger"};
describe("learner calendar selected IST day export",()=>{
 it("exports UTC instants of scoped events on their IST day and escapes properties",()=>{
  const data=learnerScheduleDayIcs([event],"2026-10-15");
  expect(data.count).toBe(1);
  expect(data.content).toContain("DTSTART:20261014T190000Z");
  expect(data.content).toContain("SUMMARY:Lab\\, Week 2");
  expect(data.content).toContain("Line one\\nATTENDEE:danger");
  expect(learnerScheduleDayIcs([event],"2026-10-14").count).toBe(0);
 });
 it("rejects invalid day and caps long day exports",()=>{
  expect(learnerScheduleDayIcs([event],"../../foreign").count).toBe(0);
  const data=learnerScheduleDayIcs(Array.from({length:105},()=>event),"2026-10-15");
  expect(data.count).toBe(100);
  expect(data.truncated).toBe(true);
 });
});
