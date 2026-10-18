import {describe,expect,it} from "vitest";
import {inboundMailStatusActions,inboundMailStatusTransitionAllowed,type InboundMailStatus}
 from "@/modules/inbound-mail/triage-transition-model";

describe("chat-16 private inbound triage workflow",()=>{
 const statuses:readonly InboundMailStatus[]=["NEW","TRIAGED","RESOLVED"];
 const permitted:Record<InboundMailStatus,readonly InboundMailStatus[]>={
  NEW:["TRIAGED","RESOLVED"],TRIAGED:["NEW","RESOLVED"],RESOLVED:["NEW"],
 };
 it("INBOUND-TRIAGE-16 enumerates every permitted and forbidden transition",()=>{
  for(const from of statuses){
   expect(inboundMailStatusActions(from).map(x=>x.status)).toEqual(permitted[from]);
   for(const to of statuses)
    expect(inboundMailStatusTransitionAllowed(from,to)).toBe(permitted[from].includes(to));
  }
 });
 it("INBOUND-TRIAGE-18 keeps the inbox usable when a malformed or future status arrives",()=>{
  expect(inboundMailStatusActions("UNKNOWN")).toEqual([]);
  expect(inboundMailStatusActions("")).toEqual([]);
 });
 it("INBOUND-TRIAGE-17 preserves existing labels and surfaces active handling",()=>{
  expect(inboundMailStatusActions("NEW")).toEqual([
   {status:"TRIAGED",label:"Mark being handled"},
   {status:"RESOLVED",label:"Mark done"},
  ]);
  expect(inboundMailStatusActions("TRIAGED")).toContainEqual({
   status:"NEW",label:"Move back to To read",
  });
  expect(inboundMailStatusActions("RESOLVED")).toEqual([
   {status:"NEW",label:"Move back to To read"},
  ]);
 });
});
