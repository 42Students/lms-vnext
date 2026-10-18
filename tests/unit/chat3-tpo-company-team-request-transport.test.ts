import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {
 readTpoCompanyTeamBody,TPO_COMPANY_TEAM_MAX_BODY_BYTES,
} from "@/modules/placements/tpo-company-team-request-body";

const stubs=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),mutate:vi.fn(),read:vi.fn(),apiError:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:stubs.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:stubs.context}));
vi.mock("@/modules/placements/tpo-company-team-service",()=>({
 readTpoCompanyTeam:stubs.read,mutateTpoCompanyTeam:stubs.mutate,
 TpoCompanyTeamError:class extends Error{
  constructor(public readonly code:string){super(code);}
 },
}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:stubs.apiError}));
vi.mock("@/lib/request-id",()=>({createRequestId:()=>"chat3reqid"}));
import {POST} from "@/app/api/placements/tpo/company-team/[companyId]/route";
import {TpoCompanyTeamError} from "@/modules/placements/tpo-company-team-service";
import {ZodError} from "zod";

const companyId="11111111-1111-4111-8111-111111111111";
const url="https://college.example/api/placements/tpo/company-team/"+companyId;
const params={params:Promise.resolve({companyId})};
function request(body:BodyInit|null,type="application/json",extra:Record<string,string>={}){
 return new Request(url,{method:"POST",body,headers:{"content-type":type,...extra}});
}
beforeEach(()=>{
 vi.resetAllMocks();
 stubs.origin.mockReturnValue(true);
 stubs.context.mockResolvedValue({user:{id:"tpo"}});
 stubs.mutate.mockResolvedValue({changed:true,id:"saved-message"});
 stubs.apiError.mockReturnValue(Response.json({
  error:"FORBIDDEN",message:"You cannot post here.",requestId:"safe",
 },{status:403}));
});

describe("TPO-companies-05 Company Team bounded request and replay safety",()=>{
 it("rejects malformed UTF-8, invalid JSON and incorrect media types",async()=>{
  await expect(readTpoCompanyTeamBody(request("{"))).rejects.toMatchObject({
   code:"INVALID_TEAM_JSON",status:400,
  });
  await expect(readTpoCompanyTeamBody(request(new Uint8Array([0xc3,0x28]).buffer)))
   .rejects.toMatchObject({code:"INVALID_TEAM_JSON",status:400});
  await expect(readTpoCompanyTeamBody(request("{}","text/plain")))
   .rejects.toMatchObject({code:"UNSUPPORTED_TEAM_CONTENT_TYPE",status:415});
  await expect(readTpoCompanyTeamBody(request(null))).rejects.toMatchObject({
   code:"INVALID_TEAM_JSON",status:400,
  });
 });
 it("enforces declared and streamed 16 KiB limits independently",async()=>{
  await expect(readTpoCompanyTeamBody(request("{}","application/json",{
   "content-length":String(TPO_COMPANY_TEAM_MAX_BODY_BYTES+1),
  }))).rejects.toMatchObject({code:"TEAM_BODY_TOO_LARGE",status:413});
  await expect(readTpoCompanyTeamBody(request("x".repeat(TPO_COMPANY_TEAM_MAX_BODY_BYTES+1))))
   .rejects.toMatchObject({code:"TEAM_BODY_TOO_LARGE",status:413});
  for(const length of ["-1","NaN","1e3","1.5"]){
   await expect(readTpoCompanyTeamBody(request("{}","application/json",{
    "content-length":length,
   }))).rejects.toMatchObject({code:"INVALID_TEAM_JSON",status:400});
  }
 });
 it("round trips Unicode and UUID idempotency metadata unchanged",async()=>{
  const input={action:"SEND",body:"తెలుగు – decision",decision:true,
   idempotencyKey:"22222222-2222-4222-8222-222222222222"};
  await expect(readTpoCompanyTeamBody(request(JSON.stringify(input)))).resolves.toEqual(input);
 });
 it("refuses forged origin before session lookup or any database mutation",async()=>{
  stubs.origin.mockReturnValue(false);
  const response=await POST(request("{}"),params);
  expect(response.status).toBe(403);
  expect(stubs.context).not.toHaveBeenCalled();
  expect(stubs.mutate).not.toHaveBeenCalled();
 });
 it("gives safe 400/413/415 recovery and a request ID without creating messages",async()=>{
  const cases=[
   {req:request("{"),status:400,message:"Check the Team update and try again."},
   {req:request("{}","text/plain"),status:415,message:"Send the Team update as JSON and try again."},
   {req:request("x".repeat(TPO_COMPANY_TEAM_MAX_BODY_BYTES+1)),status:413,
    message:"The Team message is too large. Shorten it and try again."},
  ];
  for(const row of cases){
   const response=await POST(row.req,params);
   expect(response.status).toBe(row.status);
   expect(response.headers.get("x-request-id")).toBe("chat3reqid");
   expect(await response.json()).toMatchObject({message:row.message,requestId:"chat3reqid"});
  }
  expect(stubs.mutate).not.toHaveBeenCalled();
 });
 it("maps persisted company, stale revision, closed storage and role denials into friendly errors",async()=>{
  const cases=[
   {code:"NOT_FOUND",status:404,message:"This company discussion is unavailable."},
   {code:"STALE",status:409,message:"This message changed. Reload the discussion and retry."},
   {code:"NOT_AUTHORIZED",status:403,message:"You do not have permission to change this message."},
   {code:"STORAGE_PENDING",status:503,
    message:"Company Team messages are temporarily unavailable. Retry later."},
   {code:"BAD_ACTION",status:422,message:"Check the Team message details and try again."},
  ];
  for(const entry of cases){
   stubs.mutate.mockRejectedValueOnce(new TpoCompanyTeamError(entry.code));
   const response=await POST(request(JSON.stringify({action:"SEND",body:"Question"})),params);
   expect(response.status).toBe(entry.status);
   expect(response.headers.get("x-request-id")).toBe("chat3reqid");
   expect(await response.json()).toMatchObject({error:entry.code,
    message:entry.message,requestId:"chat3reqid"});
  }
  expect(stubs.mutate).toHaveBeenCalledTimes(cases.length);
 });
 it("returns a friendly validation error for malformed domain input",async()=>{
  stubs.mutate.mockRejectedValueOnce(new ZodError([]));
  const response=await POST(request("{}"),params);
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
   error:"INVALID_REQUEST",message:"Check the Team message details and try again.",
   requestId:"chat3reqid",
  });
 });
 it("passes a valid post with the signed-in actor and exact company path",async()=>{
  const input={action:"SEND",body:"New discussion",decision:false,
   idempotencyKey:"22222222-2222-4222-8222-222222222222"};
  const response=await POST(request(JSON.stringify(input)),params);
  expect(response.status).toBe(200);
  expect(stubs.mutate).toHaveBeenCalledWith({user:{id:"tpo"}},companyId,input);
 });
 it("retains one pending request and the same UUID after a lost send response",()=>{
  const source=readFileSync(join(process.cwd(),
   "src/components/tpo/tpo-company-team-conversation.tsx"),"utf8");
  expect(source).toContain("if(pending.current||busy)return false;");
  expect(source).toContain("pending.current=true;");
  expect(source).toContain("finally{pending.current=false;setBusy(false);}");
  expect(source).toContain("sendKey.current?.fingerprint!==fingerprint");
  expect(source).toContain("sendKey.current={fingerprint,key:crypto.randomUUID()}");
  expect(source).toContain("idempotencyKey:sendKey.current.key");
  expect(source).toContain("if(ok){sendKey.current=null;");
 });
});
