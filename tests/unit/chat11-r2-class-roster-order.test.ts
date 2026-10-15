import {expect,it} from "vitest";
import {assertRosterStillCurrent} from "@/modules/projects/class-team-roster-snapshot";
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
const base={collegeId:a,classId:b,revision:"same",members:[{membershipId:a,rollNumber:"01"},{membershipId:b,rollNumber:"02"}]};
it("does not mistake a display-order change for enrollment drift",()=>{
 const current={...base,members:[...base.members].reverse()};
 expect(assertRosterStillCurrent(base,current).members).toEqual(current.members);
});
it("still refuses changed learner identity, roll number or revision",()=>{
 expect(()=>assertRosterStillCurrent(base,{...base,revision:"new"})).toThrow("CLASS_ROSTER_STALE");
 expect(()=>assertRosterStillCurrent(base,{...base,members:[{...base.members[0],rollNumber:"03"},base.members[1]]})).toThrow("CLASS_ROSTER_STALE");
});
