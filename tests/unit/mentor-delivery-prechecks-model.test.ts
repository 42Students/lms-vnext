import {describe,expect,it} from "vitest";
import {mentorDeliveryPrechecks} from
 "@/modules/projects/mentor-delivery-prechecks-model";
const base={sprints:{total:16,completed:16},
 tasks:{total:48,done:48,proofCovered:42},
 releases:{total:3,shipped:2},
 targetEndDate:"2026-10-30",asOfIstDate:"2026-10-24"};
describe("Mentor source-backed final submission prechecks",()=>{
 it("matches the normal server shipment/Sprint/task gates and advisory proof",()=>{
  const checks=mentorDeliveryPrechecks(base);
  expect(checks.map(x=>[x.key,x.state,x.requiredByServer])).toEqual([
   ["SPRINTS","MET",true],["TASKS","MET",true],
   ["RELEASES","OPEN",true],["EVIDENCE","OPEN",false],
   ["TARGET","MET",false],
  ]);
  expect(checks[0]?.label).toBe("16 of 16 sprints signed off");
  expect(checks[1]?.label).toBe("48 of 48 current tasks completed");
 });
 it("does not call absent planned work complete",()=>{
  const rows=mentorDeliveryPrechecks({
   ...base,sprints:{total:0,completed:0},tasks:{total:0,done:0,proofCovered:0},
   releases:{total:0,shipped:0},targetEndDate:null,
  });
  expect(rows.map(row=>row.state)).toEqual([
   "OPEN","OPEN","OPEN","OPEN","UNKNOWN",
  ]);
 });
 it("calls an elapsed project target informational, not an invented hard block",()=>{
  const rows=mentorDeliveryPrechecks({...base,targetEndDate:"2026-10-20"});
  expect(rows.at(-1)).toMatchObject({
   state:"PAST_TARGET",requiredByServer:false,
  });
 });
 it("does not confuse invalid or unavailable target with a met deadline",()=>{
  expect(mentorDeliveryPrechecks({...base,targetEndDate:"not-a-date"}).at(-1)
   ?.state).toBe("UNKNOWN");
 });
});
