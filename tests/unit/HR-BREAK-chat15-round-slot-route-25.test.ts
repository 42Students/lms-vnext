import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({origin:vi.fn(),context:vi.fn(),
 edit:vi.fn(),slot:vi.fn(),parseDate:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/placements/hr-round-editor-service",()=>({
 editHrJobRound:mocks.edit,
}));
vi.mock("@/modules/placements/hr-interview-slot-service",()=>({
 writeHrInterviewSlot:mocks.slot,
}));
vi.mock("@/modules/placements/hr-interview-slot-model",()=>({
 parseIstLocalSlot:mocks.parseDate,
}));
import {POST as editRound}
 from "@/app/api/placements/recruiter/drives/[jobId]/rounds/route";
import {POST as editSlot}
 from "@/app/api/placements/recruiter/drives/[jobId]/interview-slots/route";
import {PlacementsServiceError} from "@/modules/placements/errors";

const jobId="123e4567-e89b-42d3-a456-426614174001";
const slotId="123e4567-e89b-42d3-a456-426614174002";
const roundId="123e4567-e89b-42d3-a456-426614174003";
const actor={user:{id:"recruiter-a",platformStatus:"ACTIVE"}};
const params={params:Promise.resolve({jobId})};
const payload=(kind:"round"|"slot",values:Record<string,string>)=>{
 const suffix=kind==="round"?"rounds":"interview-slots";
 return new Request("https://lms.example.org/api/placements/recruiter/drives/"+jobId+"/"+suffix,{
  method:"POST",headers:{Origin:"https://lms.example.org",
   "Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams(values).toString(),
 });
};
describe("HR-ROUND-SLOT-ROUTE-25 recruiter mutation routes fail closed",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.origin.mockReturnValue(true);
  mocks.context.mockResolvedValue(actor);
  mocks.edit.mockResolvedValue({id:roundId,action:"CREATED"});
  mocks.slot.mockResolvedValue({id:slotId});
  mocks.parseDate.mockImplementation((raw:string)=>new Date(raw));
 });
 it.each(["round","slot"] as const)(
  "%s rejects cross-origin before session access, forms and mutation",async kind=>{
   mocks.origin.mockReturnValue(false);
   const req=payload(kind,{action:"CREATE"});
   const result=kind==="round"?await editRound(req,params):await editSlot(req,params);
   expect(result.status).toBe(403);
   expect(await result.json()).toEqual({error:"INVALID_ORIGIN"});
   expect(mocks.context).not.toHaveBeenCalled();
   expect(mocks.edit).not.toHaveBeenCalled();
   expect(mocks.slot).not.toHaveBeenCalled();
  });
 it("invalid round fields return 400 without loading account or writing rows",async()=>{
  const result=await editRound(payload("round",{
   action:"CREATE",kind:"INTERVIEW",name:" ",
   roundId:"foreign-college",expectedUpdatedAt:"stale",
  }),params);
  expect(result.status).toBe(400);
  expect(await result.json()).toMatchObject({error:"INVALID_ROUND"});
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.edit).not.toHaveBeenCalled();
 });
 it("valid new round produces first-party 303 without returning private records",async()=>{
  const req=payload("round",{action:"CREATE",kind:"INTERVIEW",name:"Technical"});
  const result=await editRound(req,params);
  expect(result.status).toBe(303);
  expect(result.headers.get("location")).toBe(
   "https://lms.example.org/recruiter/drives/"+jobId+"/rounds/editor?changed=CREATED");
  expect(mocks.edit).toHaveBeenCalledWith(actor,jobId,
   expect.objectContaining({action:"CREATE",kind:"INTERVIEW",name:"Technical"}));
 });
 it("stale and already-used round versions return 409, not silent success",async()=>{
  mocks.edit.mockRejectedValue(new PlacementsServiceError("PLACEMENT_ROUND_STALE"));
  const req=payload("round",{action:"CREATE",kind:"INTERVIEW",name:"Technical"});
  const result=await editRound(req,params);
  expect(result.status).toBe(409);
  expect(await result.json()).toEqual({error:"STALE_OR_USED_ROUND"});
 });
 it("slot OFFER makes only a scoped write and redirects within the same employer drive",async()=>{
  const req=payload("slot",{action:"OFFER",slotId,expectedVersion:"4"});
  const result=await editSlot(req,params);
  expect(result.status).toBe(303);
  expect(result.headers.get("location")).toBe(
   "https://lms.example.org/recruiter/drives/"+jobId+"/interview-slots");
  expect(mocks.slot).toHaveBeenCalledWith(actor,jobId,{
   action:"OFFER",slotId,expectedVersion:"4",
  });
  expect(mocks.edit).not.toHaveBeenCalled();
 });
 it("conflicted interview capacity produces typed 409 without exposing SQL",async()=>{
  mocks.slot.mockRejectedValue(new Error("SLOT_FULL"));
  const req=payload("slot",{action:"BOOK",slotId,expectedVersion:"5"});
  const result=await editSlot(req,params);
  expect(result.status).toBe(409);
  expect(await result.json()).toEqual({error:"SLOT_FULL"});
 });
 it("malformed IST slot date is a recoverable 400 without touching interview storage",async()=>{
  mocks.parseDate.mockImplementation(()=>{throw new Error("INVALID_IST_DATE");});
  const req=payload("slot",{action:"CREATE",roundId,startAt:"bad",endAt:"bad",mode:"VIRTUAL",capacity:"2"});
  const result=await editSlot(req,params);
  expect(result.status).toBe(400);
  expect(await result.json()).toEqual({error:"INVALID_SLOT_DATE"});
  expect(mocks.slot).not.toHaveBeenCalled();
 });
});
