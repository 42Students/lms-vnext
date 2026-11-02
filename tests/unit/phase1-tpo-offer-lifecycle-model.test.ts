import {describe,expect,it} from "vitest";
import {
 TPO_OFFER_ACTIONS,canRecordTpoOfferAction,tpoOfferLegacyStatusCopy,tpoOfferDistinctSelection,
 legacyTpoOfferDisplayStatus,tpoVerifySelectionBatch,tpoBulkVerifySelectionsSchema,
 externalTpoAcceptanceFinalization,type TpoOfferAction,
} from "@/modules/placements/tpo-offer-lifecycle-model";

const uuid=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;

describe("PHASE1-OFFER-ACTION offer action permission matrix",()=>{
 const STATUSES=["ISSUED","ACCEPTED","DECLINED","WITHDRAWN","REVOKED","JOINED","EXPIRED","",undefined as unknown as string];
 const JOINING=[null,"PENDING","COMPLETED","NOT_JOINED"];
 const ALLOWED:Record<TpoOfferAction,[string,string|null][]>={
  EXTEND:[["ISSUED",null]],
  RECORD_ACCEPTED:[["ISSUED",null]],
  RECORD_DECLINED:[["ISSUED",null]],
  RECORD_JOINED:[["ACCEPTED",null],["ACCEPTED","PENDING"]],
  WITHDRAW:[["ISSUED",null],["ACCEPTED",null],["ACCEPTED","PENDING"]],
 };

 it("PHASE1-OFFER-ACTION-01 allows exactly the documented (status, joining) pairs for each action (full matrix)",()=>{
  expect([...TPO_OFFER_ACTIONS].sort()).toEqual(Object.keys(ALLOWED).sort());
  for(const action of TPO_OFFER_ACTIONS)for(const status of STATUSES)for(const joining of JOINING)
   expect(canRecordTpoOfferAction(action,status,joining),`${action} ${String(status)} ${String(joining)}`)
    .toBe(ALLOWED[action].some(([s,j])=>s===status&&j===joining));
 });
 it("PHASE1-OFFER-ACTION-02 a terminal offer (declined, withdrawn, revoked, joined) permits no action at all",()=>{
  for(const status of ["DECLINED","WITHDRAWN","REVOKED","JOINED"])
   for(const action of TPO_OFFER_ACTIONS)for(const joining of JOINING)
    expect(canRecordTpoOfferAction(action,status,joining),`${action} ${status}`).toBe(false);
 });
 it("PHASE1-OFFER-ACTION-03 an issued offer with joining history is corrupt and is never rewritten",()=>{
  for(const action of TPO_OFFER_ACTIONS)
   expect(canRecordTpoOfferAction(action,"ISSUED","PENDING"),action).toBe(false);
 });
});

describe("PHASE1-OFFER-COPY legacy offer status wording",()=>{
 it("PHASE1-OFFER-COPY-01 uses the exact legacy labels and the actor suffix",()=>{
  const labels:[string,string][]=[["ISSUED","Offer sent"],["ACCEPTED","Accepted"],["DECLINED","Declined"],["WITHDRAWN","Withdrawn"],["REVOKED","Revoked"],["JOINED","Joined"]];
  for(const [status,label] of labels){
   expect(tpoOfferLegacyStatusCopy(status,"COMPANY"),status).toBe(`${label} · Company`);
   expect(tpoOfferLegacyStatusCopy(status,"STAFF"),status).toBe(`${label} · Recorded by placement cell`);
  }
 });
 it("PHASE1-OFFER-COPY-02 unknown statuses are shown readably and prototype keys cannot leak function text",()=>{
  expect(tpoOfferLegacyStatusCopy("PENDING_REVIEW","COMPANY")).toBe("PENDING REVIEW · Company");
  for(const key of ["constructor","toString","__proto__","hasOwnProperty"]){
   const copy=tpoOfferLegacyStatusCopy(key,"STAFF");
   expect(copy,key).toBe(`${key.replaceAll("_"," ")} · Recorded by placement cell`);
   expect(copy).not.toContain("native code");
  }
 });
 it("PHASE1-OFFER-COPY-03 selection de-duplication keeps first-seen order and counts the duplicates",()=>{
  expect(tpoOfferDistinctSelection([])).toEqual({ids:[],duplicateCount:0});
  expect(tpoOfferDistinctSelection(["a","b","a","c","b","a"])).toEqual({ids:["a","b","c"],duplicateCount:3});
  expect(tpoOfferDistinctSelection(["x","y"])).toEqual({ids:["x","y"],duplicateCount:0});
 });
});

describe("PHASE1-OFFER-DISPLAY legacy offer display status",()=>{
 const now=new Date("2026-06-01T12:00:00.000Z");
 it("PHASE1-OFFER-DISPLAY-01 a recorded offer status wins over any selection status",()=>{
  for(const status of ["ACCEPTED","DECLINED","WITHDRAWN","REVOKED"])
   expect(legacyTpoOfferDisplayStatus({offerStatus:status,selectionStatus:"SELECTED",now}),status).toBe(status);
 });
 it("PHASE1-OFFER-DISPLAY-02 an issued offer is released until the instant its expiry arrives, then expired",()=>{
  expect(legacyTpoOfferDisplayStatus({offerStatus:"ISSUED",now})).toBe("RELEASED");
  expect(legacyTpoOfferDisplayStatus({offerStatus:"ISSUED",expiresAt:null,now})).toBe("RELEASED");
  expect(legacyTpoOfferDisplayStatus({offerStatus:"ISSUED",expiresAt:new Date(now.getTime()+1),now})).toBe("RELEASED");
  expect(legacyTpoOfferDisplayStatus({offerStatus:"ISSUED",expiresAt:new Date(now.getTime()),now})).toBe("EXPIRED");
  expect(legacyTpoOfferDisplayStatus({offerStatus:"ISSUED",expiresAt:new Date(now.getTime()-1),now})).toBe("EXPIRED");
 });
 it("PHASE1-OFFER-DISPLAY-03 without an offer, the selection ledger decides and a verified selection is not yet an offer",()=>{
  expect(legacyTpoOfferDisplayStatus({selectionStatus:"SELECTED"})).toBe("SELECTED");
  expect(legacyTpoOfferDisplayStatus({selectionStatus:"PENDING_VERIFICATION"})).toBe("PENDING_VERIFICATION");
  expect(legacyTpoOfferDisplayStatus({selectionStatus:"VERIFIED"})).toBe("PENDING_VERIFICATION");
  expect(legacyTpoOfferDisplayStatus({selectionStatus:"RELEASED"})).toBe("RELEASED");
 });
 it("PHASE1-OFFER-DISPLAY-04 anything unrecognised is UNKNOWN and never invents a released offer",()=>{
  expect(legacyTpoOfferDisplayStatus({})).toBe("UNKNOWN");
  expect(legacyTpoOfferDisplayStatus({offerStatus:null,selectionStatus:null})).toBe("UNKNOWN");
  expect(legacyTpoOfferDisplayStatus({offerStatus:"JOINED"})).toBe("UNKNOWN");
  expect(legacyTpoOfferDisplayStatus({offerStatus:"expired",selectionStatus:"selected"})).toBe("UNKNOWN");
 });
});

describe("PHASE1-OFFER-VERIFY selection verification batch",()=>{
 const college="11111111-1111-4111-8111-111111111111";
 const other="22222222-2222-4222-8222-222222222222";
 it("PHASE1-OFFER-VERIFY-01 verifies only selected candidates in the caller's college and reports each failure separately",()=>{
  const result=tpoVerifySelectionBatch([
   {id:"a",status:"SELECTED",collegeId:college},
   {id:"b",status:"VERIFIED",collegeId:college},
   {id:"c",status:"SELECTED",collegeId:other},
   {id:"d",status:"RELEASED",collegeId:other},
  ],college);
  expect(result).toEqual([
   {selectionId:"a",ok:true,error:null},
   {selectionId:"b",ok:false,error:"Only selected candidates can be verified"},
   {selectionId:"c",ok:false,error:"Selection not available in your college"},
   {selectionId:"d",ok:false,error:"Selection not available in your college"},
  ]);
 });
 it("PHASE1-OFFER-VERIFY-02 a cross-college row never reveals its status and an empty batch yields nothing",()=>{
  const [row]=tpoVerifySelectionBatch([{id:"x",status:"WITHDRAWN",collegeId:other}],college);
  expect(row!.error).toBe("Selection not available in your college");
  expect(tpoVerifySelectionBatch([],college)).toEqual([]);
 });
 it("PHASE1-OFFER-VERIFY-03 the bulk command needs confirmation and 1..200 distinct UUIDs and rejects extra fields",()=>{
  const ok={confirmed:true,selectionIds:[uuid(1)]};
  expect(tpoBulkVerifySelectionsSchema.safeParse(ok).success).toBe(true);
  expect(tpoBulkVerifySelectionsSchema.safeParse({...ok,confirmed:false}).success).toBe(false);
  expect(tpoBulkVerifySelectionsSchema.safeParse({selectionIds:[uuid(1)]}).success).toBe(false);
  expect(tpoBulkVerifySelectionsSchema.safeParse({...ok,selectionIds:[]}).success).toBe(false);
  expect(tpoBulkVerifySelectionsSchema.safeParse({...ok,selectionIds:[uuid(1),uuid(1)]}).success).toBe(false);
  expect(tpoBulkVerifySelectionsSchema.safeParse({...ok,selectionIds:["nope"]}).success).toBe(false);
  expect(tpoBulkVerifySelectionsSchema.safeParse({...ok,selectionIds:Array.from({length:200},(_,i)=>uuid(i+1))}).success).toBe(true);
  expect(tpoBulkVerifySelectionsSchema.safeParse({...ok,selectionIds:Array.from({length:201},(_,i)=>uuid(i+1))}).success).toBe(false);
  expect(tpoBulkVerifySelectionsSchema.safeParse({...ok,collegeId:college}).success).toBe(false);
 });
 it("PHASE1-OFFER-VERIFY-04 the schema carries the exact operator messages",()=>{
  const empty=tpoBulkVerifySelectionsSchema.safeParse({confirmed:true,selectionIds:[]});
  const dupes=tpoBulkVerifySelectionsSchema.safeParse({confirmed:true,selectionIds:[uuid(1),uuid(1)]});
  const many=tpoBulkVerifySelectionsSchema.safeParse({confirmed:true,selectionIds:Array.from({length:201},(_,i)=>uuid(i+1))});
  expect(JSON.stringify(empty.error?.issues)).toContain("Choose at least one selection");
  expect(JSON.stringify(dupes.error?.issues)).toContain("Select distinct selections");
  expect(JSON.stringify(many.error?.issues)).toContain("Verify at most 200 selections at a time");
 });
});

describe("PHASE1-OFFER-EXTERNAL external acceptance finalization",()=>{
 const now=new Date("2026-06-01T12:00:00.000Z");
 const input=(over:Partial<{channel:string|null;disputableUntil:Date|null;disputed:boolean;cascadeId:string|null}>={})=>({
  channel:"EXTERNAL_IMPORT" as string|null,disputableUntil:new Date(now.getTime()-1) as Date|null,disputed:false,now,cascadeId:null as string|null,...over,
 });
 it("PHASE1-OFFER-EXTERNAL-01 only external-import acceptances are provisional",()=>{
  for(const channel of [null,"PLATFORM","MANUAL",""])
   expect(externalTpoAcceptanceFinalization(input({channel})),String(channel)).toBe("NOT_EXTERNAL");
 });
 it("PHASE1-OFFER-EXTERNAL-02 a dispute blocks everything, even after the window closes",()=>{
  expect(externalTpoAcceptanceFinalization(input({disputed:true,cascadeId:"c1"}))).toBe("DISPUTED");
  expect(externalTpoAcceptanceFinalization(input({disputed:true,disputableUntil:null}))).toBe("DISPUTED");
 });
 it("PHASE1-OFFER-EXTERNAL-03 the 48-hour window must have closed; a missing deadline fails closed",()=>{
  expect(externalTpoAcceptanceFinalization(input({disputableUntil:null}))).toBe("WAITING_DISPUTE_WINDOW");
  expect(externalTpoAcceptanceFinalization(input({disputableUntil:new Date(now.getTime()+1)}))).toBe("WAITING_DISPUTE_WINDOW");
  expect(externalTpoAcceptanceFinalization(input({disputableUntil:new Date(now.getTime())}))).toBe("AWAITING_CASCADE");
 });
 it("PHASE1-OFFER-EXTERNAL-04 after the window, finalization needs the separate cascade confirmation",()=>{
  expect(externalTpoAcceptanceFinalization(input({cascadeId:null}))).toBe("AWAITING_CASCADE");
  expect(externalTpoAcceptanceFinalization(input({cascadeId:"cascade-1"}))).toBe("FINALIZED");
 });
});
