import {describe,expect,it} from "vitest";
import {prioritizeRecruiterOfferFollowups,HR_FOLLOWUP_JOB_STATUSES}
 from "@/modules/placements/hr-today-offer-followup-model";
const item=(status:string,count:number,jobId=status)=>({
 status,count,jobId,jobTitle:"Role "+jobId,
});
describe("HR-OFFER-FOLLOWUPS-95: employer Today actions stay accurate and private",()=>{
 it("shows only issued, accepted or declined persisted offer states",()=>{
  const rows=[item("ISSUED",2),item("ACCEPTED",1),item("DECLINED",1),
   item("REVOKED",10),item("DRAFT",99),item("WITHDRAWN",2)];
  expect(prioritizeRecruiterOfferFollowups(rows).map(x=>x.status))
   .toEqual(["ISSUED","ACCEPTED","DECLINED"]);
 });
 it("discards corrupt, fractional, negative or infinite offer aggregate counts",()=>{
  for(const value of [Number.NaN,Infinity,-Infinity,-1,0,0.25]){
   expect(prioritizeRecruiterOfferFollowups([item("ISSUED",value)])).toEqual([]);
  }
 });
 it("prioritizes outstanding issued offers and sorts equivalent rows predictably",()=>{
  const rows=[item("ACCEPTED",5,"z"),item("ISSUED",2,"b"),
   item("ISSUED",1,"a"),item("DECLINED",9,"c")];
  expect(prioritizeRecruiterOfferFollowups(rows,2).map(x=>x.jobId)).toEqual(["a","b"]);
  expect(rows.map(x=>x.jobId)).toEqual(["z","b","a","c"]);
 });
 it("preserves closed drives for post-closing offer follow-up while excluding unrelated states",()=>{
  expect(HR_FOLLOWUP_JOB_STATUSES).toEqual(["PUBLISHED","CLOSED"]);
  expect(prioritizeRecruiterOfferFollowups([item("ISSUED",3)],0)).toEqual([]);
 });
});