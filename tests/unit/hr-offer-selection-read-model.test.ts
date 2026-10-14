import {describe,expect,it} from "vitest";
import {buildHrOfferOverview,hrSelectionReadyApplicationIds} from "@/modules/placements/hr-offer-selection-read-model";
const now=new Date("2026-10-14T12:00:00Z");
describe("HR selection and offer read-only status",()=>{
 it("keeps overdue, accepted and confirmed joining separate",()=>{
  const o=(id:string,status:string,expiresAt:Date|null,joiningStatus:string|null)=>({id,applicationId:id,status,expiresAt,joiningStatus});
  const result=buildHrOfferOverview([o("a","ISSUED",new Date("2026-10-10T00:00:00Z"),null),
    o("b","ISSUED",null,null),o("c","ACCEPTED",null,"JOINED"),o("d","DECLINED",null,null)],now);
  expect(result).toEqual({recorded:4,issued:2,accepted:1,declined:1,joined:1,awaitingReply:1,overdue:1});
 });
 it("requires completed APPLIED PASS final results before selection",()=>{
  const rounds=[{kind:"TEST",status:"COMPLETED",participants:[{applicationId:"a",result:{status:"APPLIED",outcome:"PASS"}},
    {applicationId:"b",result:{status:"STAGED",outcome:"PASS"}}]}];
  expect(hrSelectionReadyApplicationIds(rounds)).toEqual(["a"]);
  expect(hrSelectionReadyApplicationIds([{...rounds[0],status:"SCHEDULED"}])).toEqual([]);
  expect(hrSelectionReadyApplicationIds([{...rounds[0],kind:"TALK"}])).toEqual([]);
 });
});
