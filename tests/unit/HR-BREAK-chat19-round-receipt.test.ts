import {beforeEach,describe,expect,it,vi} from "vitest";
import {isVerifiedHrRoundMutation} from "@/modules/placements/hr-round-editor-model";

const mocks=vi.hoisted(()=>({edit:vi.fn(),context:vi.fn(),sameOrigin:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.sameOrigin}));
vi.mock("@/modules/placements/hr-round-editor-service",()=>({editHrJobRound:mocks.edit}));
import {POST} from "@/app/api/placements/recruiter/drives/[jobId]/rounds/route";
import {readFileSync} from "node:fs";

const jobId="11111111-1111-4111-8111-111111111111";
const roundId="22222222-2222-4222-8222-222222222222";
function req(accept?:string){
 const body=new FormData();body.set("action","CREATE");body.set("name","Technical interview");
 body.set("kind","INTERVIEW");
 return new Request("https://lms.invalid/api/placements/recruiter/drives/"+jobId+"/rounds",{
  method:"POST",body,headers:accept?{Accept:accept}:undefined,
 });
}
const route=(request:Request)=>POST(request,{params:Promise.resolve({jobId})});
describe("HR-BREAK-ROUND-RECEIPT-31: inline editor must verify persisted success",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();mocks.sameOrigin.mockReturnValue(true);
  mocks.context.mockResolvedValue({user:{id:"recruiter"}});
  mocks.edit.mockResolvedValue({id:roundId,action:"CREATED"});
 });
 it.each([
  [{saved:true,id:roundId,action:"CREATED"},"CREATE",null,true],
  [{saved:true,id:roundId,action:"UPDATED"},"UPDATE",roundId,true],
  [{saved:true,id:roundId,action:"REMOVED"},"REMOVE",roundId,true],
  [{saved:true,id:roundId,action:"UPDATED"},"REMOVE",roundId,false],
  [{saved:true,id:jobId,action:"UPDATED"},"UPDATE",roundId,false],
  [{saved:true,id:"bad-uuid",action:"CREATED"},"CREATE",null,false],
  [{saved:false,id:roundId,action:"CREATED"},"CREATE",null,false],
  ["<html>Sign in</html>","CREATE",null,false],
  [null,"CREATE",null,false],
 ] as const)("rejects false-positive mutation receipt %j", (receipt,action,id,expected)=>{
  expect(isVerifiedHrRoundMutation(receipt,action,id)).toBe(expected);
 });
 it("returns a JSON receipt only after the authorized service persisted the mutation",async()=>{
  const response=await route(req("application/json"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({saved:true,id:roundId,action:"CREATED"});
  expect(mocks.edit).toHaveBeenCalledWith(expect.anything(),jobId,
    expect.objectContaining({action:"CREATE",name:"Technical interview"}));
 });
 it("preserves the 303 redirect for native forms rather than changing old LMS behavior",async()=>{
  const response=await route(req());
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toContain("/recruiter/drives/"+jobId+"/rounds/editor?changed=CREATED");
 });
 it("rejects cross-origin posts before service writes in both response modes",async()=>{
  mocks.sameOrigin.mockReturnValue(false);
  const response=await route(req("application/json"));
  expect(response.status).toBe(403);
  expect(mocks.edit).not.toHaveBeenCalled();
 });
 it("client never treats a login redirect or HTML 200 as a saved round",()=>{
  const ui=readFileSync("src/components/hr/recruiter-round-inline-editor.tsx","utf8");
  expect(ui).toContain('redirect:"error"');
  expect(ui).toContain('Accept:"application/json"');
  expect(ui).toContain("isVerifiedHrRoundMutation(receipt,action,active?.id??null)");
  expect(ui).not.toContain('response.type==="opaqueredirect"');
  expect(ui).not.toContain("||response.ok");
 });
});
