import {describe,expect,it} from "vitest";
import {learnerDriveEvidenceRequirements} from "@/modules/placements/learner-drive-evidence-requirements-model";
const row=(id:string,checks:string[],canApply:boolean,deadlinePassed:boolean)=>({
 roleOption:{id,title:"Graduate Engineer"},
 eligibility:{checks:checks.map(status=>({status}))},
 canApply,deadlinePassed,
});
describe("L13-011 role evidence requirements",()=>{
 it("shows only persisted check evidence, not inferred registration",()=>{
  expect(learnerDriveEvidenceRequirements([
    row("a",["PASS","MISSING","FAIL"],true,false),
    row("b",[],true,true)
  ])).toEqual([
   {id:"a",title:"Graduate Engineer",checked:3,passed:1,missing:1,failed:1,actionable:true},
   {id:"b",title:"Graduate Engineer",checked:0,passed:0,missing:0,failed:0,actionable:false},
  ]);
 });
});
