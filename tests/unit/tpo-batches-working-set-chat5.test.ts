import {describe,expect,it} from "vitest";
import {tpoBatchIsOlder,visibleTpoBatchWorkingSet} from "@/modules/placements/tpo-batch-working-set-model";
import {tpoBatchMatchesPlacementState} from "@/modules/placements/tpo-batch-state-label-model";
const now=new Date("2099-07-01T00:00:00Z");
const active={id:"active",finishedAt:null,invitedAt:new Date("2099-02-01T00:00:00Z"),endYear:2099};
const past={id:"past",finishedAt:null,invitedAt:null,endYear:2090};
const finished={id:"finished",finishedAt:new Date("2099-03-01T00:00:00Z"),invitedAt:null,endYear:2099};
describe("Batch older working set",()=>{
 it("TPO-batches-07 hides finished and uninvited past batches until Show older is selected",()=>{
  expect(tpoBatchIsOlder(past,2099)).toBe(true);
  expect(tpoBatchIsOlder(active,2099)).toBe(false);
  const hidden=visibleTpoBatchWorkingSet([active,past,finished],2099,false);
  expect(hidden.visible.map(x=>x.id)).toEqual(["active"]);
  expect(hidden.hidden).toBe(2);
  expect(visibleTpoBatchWorkingSet([active,past,finished],2099,true).visible).toHaveLength(3);
  expect(visibleTpoBatchWorkingSet([active,past,finished],2099,false,true).visible).toHaveLength(3);
 });
 it("GR-71 shows a useful current working set without losing older batches",()=>{
  expect(visibleTpoBatchWorkingSet([past,finished],2099,false)).toMatchObject({visible:[],hidden:2});
  expect(visibleTpoBatchWorkingSet([past,finished],2099,false,true).visible).toHaveLength(2);
 });
 it("TPO-batches-03 filters using effective eligibility rather than invitation lifecycle",()=>{
  const invitedNoEligible={finishedAt:null,eligible:0};
  const uninvitedEligible={finishedAt:null,eligible:5};
  expect(tpoBatchMatchesPlacementState(invitedNoEligible,"NOT_STARTED")).toBe(true);
  expect(tpoBatchMatchesPlacementState(uninvitedEligible,"IN_PLACEMENTS")).toBe(true);
  expect(tpoBatchMatchesPlacementState(uninvitedEligible,"PLANNING")).toBe(false);
  expect(tpoBatchMatchesPlacementState({finishedAt:now,eligible:5},"FINISHED")).toBe(true);
 });
 it("TPO-batches-04 counts only batches with eligible learners as open for placements",()=>{
  const entries=[{finishedAt:null,eligible:2},{finishedAt:null,eligible:0},{finishedAt:now,eligible:3}];
  const open=entries.filter(value=>tpoBatchMatchesPlacementState(value,"IN_PLACEMENTS"));
  expect(open).toHaveLength(1);
 });

});
