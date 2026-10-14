import {describe,it,expect} from "vitest";
import {offerRegisterQuery,projectOfferRegister,offerExpiryIndicator,tpoDriveOfferRegisterCsv} from "@/modules/placements/tpo-drive-offer-register-model";
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
 it("pages every offer version beyond 200 without losing totals",()=>{
  const facts=Array.from({length:251},(_,i)=>row(String(i+1),"ISSUED"));
  const last=projectOfferRegister(facts,"ALL",11);
  expect(last.counts.all).toBe(251);
  expect(last.rows).toHaveLength(1);
  expect(last.page).toBe(11);
  expect(last.totalPages).toBe(11);
  expect(projectOfferRegister(facts,"ALL",20).page).toBe(11);
  expect(projectOfferRegister(facts,"ALL",2).rows).toHaveLength(25);
 });
 it("searches persisted learner names and roles literally before paging",()=>{
  const offers=[row("1","ISSUED"),row("2","ISSUED"),row("3","ACCEPTED")];
  offers[0]!.candidate.displayName="Aditi Raman";
  offers[1]!.offer.roleTitle="Data Analyst";
  expect(projectOfferRegister(offers,"ALL",1,"  ADITI " ).rows.map(x=>x.id)).toEqual(["1"]);
  expect(projectOfferRegister(offers,"ALL",1,"data").rows.map(x=>x.id)).toEqual(["2"]);
  expect(projectOfferRegister(offers,"ALL",1,"%").rows).toHaveLength(0);
  expect(projectOfferRegister(offers,"ACCEPTED",1,"data").totalMatching).toBe(0);
  expect(offerRegisterQuery.safeParse({jobId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",q:"x".repeat(101)}).success).toBe(false);
 });
 it("filters accepted offers by explicitly persisted joining states",()=>{
  const facts=[row("1","ACCEPTED"),row("2","ACCEPTED","JOINED"),row("3","ACCEPTED","DEFERRED"),row("4","ISSUED")];
  expect(projectOfferRegister(facts,"ALL",1,"","PENDING").rows.map(x=>x.id)).toEqual(["1"]);
  expect(projectOfferRegister(facts,"ALL",1,"","JOINED").rows.map(x=>x.id)).toEqual(["2"]);
  expect(projectOfferRegister(facts,"ALL",1,"","DEFERRED").rows.map(x=>x.id)).toEqual(["3"]);
  expect(projectOfferRegister(facts,"ISSUED",1,"","PENDING").totalMatching).toBe(0);
  expect(offerRegisterQuery.safeParse({jobId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",joining:"SELECTED"}).success).toBe(false);
 });
 it("classifies only issued offer expiry at exact instants",()=>{
  const now=new Date("2026-10-15T09:00:00Z");
  expect(offerExpiryIndicator("ISSUED",new Date("2026-10-15T09:00:00Z"),now)).toBe("EXPIRED");
  expect(offerExpiryIndicator("ISSUED",new Date("2026-10-16T09:00:00Z"),now)).toBe("DUE_SOON");
  expect(offerExpiryIndicator("ISSUED",new Date("2026-11-01T09:00:00Z"),now)).toBe("OPEN");
  expect(offerExpiryIndicator("ISSUED",null,now)).toBe("UNKNOWN");
  expect(offerExpiryIndicator("ACCEPTED",new Date("2026-10-01T00:00:00Z"),now)).toBe("NOT_APPLICABLE");
 });
 it("exports matching versions with formula-safe names and explicit truncation",()=>{
  const fact=row("1","ISSUED");
  fact.candidate.displayName="=HYPERLINK(1)";
  const report=tpoDriveOfferRegisterCsv([fact],{status:"ISSUED",q:"",joining:"ALL"});
  expect(report.totalMatching).toBe(1);
  expect(report.csv).toContain("\"\u0027=HYPERLINK(1)\"");
  expect(report.csv).toContain("Issued (IST)");
  const many=tpoDriveOfferRegisterCsv(Array.from({length:501},(_,i)=>row(String(i),"ISSUED")),{status:"ALL",q:"",joining:"ALL"});
  expect(many.truncated).toBe(true);
  expect(many.csv).toContain("TRUNCATED");
  expect(many.csv).toContain("First 500 of 501");
  expect(many.csv.split(/\r?\n/).filter(line=>line.includes("\"ISSUED\"")).length).toBe(500);
 });
 it("rejects unknown statuses and extra keys",()=>{
  const jobId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  expect(offerRegisterQuery.safeParse({jobId,status:"SELECTED"}).success).toBe(false);
  expect(offerRegisterQuery.safeParse({jobId,extra:true}).success).toBe(false);
 });
});
