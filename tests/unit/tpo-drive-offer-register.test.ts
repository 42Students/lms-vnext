import {describe,it,expect} from "vitest";
import {offerRegisterQuery,projectOfferRegister} from "@/modules/placements/tpo-drive-offer-register-model";
const row=(id:string,status:string,joining:string|null=null)=>({offer:{id,status,roleTitle:"Engineer",issuedAt:new Date("2026-10-01T00:00:00Z"),respondedAt:null},joining:joining?{status:joining}:null,candidate:{membershipId:id,displayName:" Name "}});
describe("offer register",()=>{
 it("counts versions, filters status and avoids invented joining",()=>{
  const facts=[row("1","ISSUED"),row("2","ACCEPTED","JOINED"),row("3","ACCEPTED")];
  const all=projectOfferRegister(facts,"ALL");
  expect(all.counts).toEqual({all:3,issued:1,accepted:2,declined:0,withdrawn:0});
  expect(all.rows.find(r=>r.id==="1")?.joining).toBeNull();
  expect(all.rows.find(r=>r.id==="3")?.joining).toBe("PENDING");
  expect(projectOfferRegister(facts,"ACCEPTED").rows).toHaveLength(2);
 });
 it("rejects unknown statuses and extra keys",()=>{
  const jobId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  expect(offerRegisterQuery.safeParse({jobId,status:"SELECTED"}).success).toBe(false);
  expect(offerRegisterQuery.safeParse({jobId,extra:true}).success).toBe(false);
 });
});
