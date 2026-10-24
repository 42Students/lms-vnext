import {describe,expect,it} from "vitest";
import {summarizeTpoPrototypePerson} from "@/modules/placements/tpo-team-people-prototype-model";
const row={membershipId:"p1",displayName:"TPO member",roles:["TPO_ADMIN"],
 status:"ACTIVE",openAsks:3,overdueAsks:2,studentDutyCount:0,awayUntil:null};
describe("TPO Team People source backed columns",()=>{
 it("does not turn missing ownership or activity into fabricated zeros",()=>{
  expect(summarizeTpoPrototypePerson(row,true)).toEqual({
   role:"TPO admin",handles:"Work ownership not verified",
   late:"2 overdue asks",waiting:"3 open asks",
  });
 });
 it("marks unavailable ask workload separately from actual zero",()=>{
  expect(summarizeTpoPrototypePerson({...row,openAsks:0,overdueAsks:0},false).waiting)
   .toBe("Unavailable");
  expect(summarizeTpoPrototypePerson({...row,openAsks:0,overdueAsks:0},true).late)
   .toBe("Nothing overdue");
 });
});
