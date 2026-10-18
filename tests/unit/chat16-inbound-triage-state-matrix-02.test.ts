import {describe,expect,it} from "vitest";
import {
 inboundMailStatusActions,inboundMailStatusTransitionAllowed,
 type InboundMailStatus,
} from "@/modules/inbound-mail/triage-transition-model";
import {createInboundMailTriageGate} from "@/modules/inbound-mail/triage-submit-model";
import {
 inboundMailMetadataSchema,inboundMailListQuerySchema,safeInboundPreview,
} from "@/modules/inbound-mail/message-model";

const statuses:InboundMailStatus[]=["NEW","TRIAGED","RESOLVED"];
const allowed=new Set(["NEW:TRIAGED","NEW:RESOLVED","TRIAGED:NEW","TRIAGED:RESOLVED","RESOLVED:NEW"]);

describe("chat-16 inbound mail ledger transition and mutation gate",()=>{
 it("INBOUND-TRIAGE-01 exhausts every status pair and forbids same-state writes",()=>{
  for(const from of statuses)for(const to of statuses){
   expect(inboundMailStatusTransitionAllowed(from,to)).toBe(allowed.has(from+":"+to));
  }
 });
 it("INBOUND-TRIAGE-02 exposes only transitions that the state machine authorizes",()=>{
  for(const from of statuses){
   const buttons=inboundMailStatusActions(from);
   const targets=buttons.map(button=>button.status);
   expect(new Set(targets).size).toBe(targets.length);
   expect(targets).toEqual(statuses.filter(to=>allowed.has(from+":"+to)));
   expect(buttons.every(button=>button.label.length>0)).toBe(true);
  }
  expect(inboundMailStatusActions("unrecognized")).toEqual([]);
  expect(inboundMailStatusActions("")).toEqual([]);
 });
 it("INBOUND-TRIAGE-03 suppresses repeat submissions and allows retry after a failed request",()=>{
  const first=createInboundMailTriageGate(),second=createInboundMailTriageGate();
  expect(first.tryBegin()).toBe(true);
  expect(first.tryBegin()).toBe(false);
  expect(second.tryBegin()).toBe(true);
  first.end();
  expect(first.tryBegin()).toBe(true);
  expect(first.tryBegin()).toBe(false);
  second.end();
  expect(second.tryBegin()).toBe(true);
 });
 it("INBOUND-TRIAGE-04 validates the inbox metadata before it is presented",()=>{
  const valid={
   id:"11111111-1111-4111-8111-111111111111",receivedAt:"2099-01-01T00:00:00Z",
   fromAddress:"person@example.org",subject:"Review",status:"NEW",
  };
  expect(inboundMailMetadataSchema.safeParse(valid).success).toBe(true);
  expect(inboundMailMetadataSchema.safeParse({...valid,status:"DELETED"}).success).toBe(false);
  expect(inboundMailMetadataSchema.safeParse({...valid,fromAddress:"bad-address"}).success).toBe(false);
  expect(inboundMailMetadataSchema.safeParse({...valid,bodyPlain:"private body"}).success).toBe(false);
 });
 it("INBOUND-TRIAGE-05 enforces a bounded inbox query and safe preview text",()=>{
  expect(inboundMailListQuerySchema.parse({})).toMatchObject({status:"ALL",page:1,q:""});
  expect(inboundMailListQuerySchema.safeParse({page:0}).success).toBe(false);
  expect(inboundMailListQuerySchema.safeParse({status:"DELETED"}).success).toBe(false);
  expect(inboundMailListQuerySchema.safeParse({recipient:"bad"}).success).toBe(false);
  expect(inboundMailListQuerySchema.safeParse({q:"x".repeat(121)}).success).toBe(false);
  expect(inboundMailListQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(safeInboundPreview("A\nB\tC\u0000D",20)).toBe("A B C D");
  expect(safeInboundPreview("short",0)).toBe("");
 });
});
