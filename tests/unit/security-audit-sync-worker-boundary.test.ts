import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {independentAuditImporterReady,syncIndependentAuditInbox} from "@/modules/bug-tracker/independent-audit-inbox-importer";
import {GET} from "@/app/api/internal/audit-findings/sync/route";
vi.mock("@/modules/bug-tracker/independent-audit-inbox-importer",()=>({
 independentAuditImporterReady:vi.fn(()=>true),
 syncIndependentAuditInbox:vi.fn(async()=>({busy:false,imported:1})),
}));
const ready=vi.mocked(independentAuditImporterReady);
const sync=vi.mocked(syncIndependentAuditInbox);
const validSecret="audit-worker-test-secret-"+"x".repeat(48);
function request(options:{secret?:string;origin?:string;url?:string;body?:string}={}):Request {
 const headers=new Headers();
 if(options.secret!==undefined)headers.set("authorization",options.secret);
 if(options.origin!==undefined)headers.set("origin",options.origin);
 // A direct handler invocation can simulate a streamed body even though
 // Next's route dispatcher calls GET only.
 return new Request(options.url??"https://lms.example.test/api/internal/audit-findings/sync",{
  method:options.body===undefined?"GET":"POST",headers,
  ...(options.body===undefined?{}:{body:options.body}),
 });
}
async function read(response:Response) {
 return {status:response.status,body:await response.json(),
  cache:response.headers.get("cache-control")};
}
describe("audit findings Cloud Scheduler boundary",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  vi.stubEnv("AUDIT_FINDINGS_CRON_SECRET",validSecret);
  ready.mockReturnValue(true);
  sync.mockResolvedValue({busy:false,imported:1} as never);
 });
 afterEach(()=>vi.unstubAllEnvs());
 it("accepts only the dedicated long bearer for the scheduled GET",async()=>{
  const result=await read(await GET(request({secret:"Bearer "+validSecret})));
  expect(result).toEqual({status:200,body:{result:{busy:false,imported:1}},
   cache:"private, no-store"});
  expect(sync).toHaveBeenCalledOnce();
 });
 it.each(["","short-secret"," ".repeat(40),"x".repeat(31),"x".repeat(257)])(
  "fails closed on malformed configured credentials %s",async secret=>{
   vi.stubEnv("AUDIT_FINDINGS_CRON_SECRET",secret);
   const response=await read(await GET(request({secret:"Bearer "+secret})));
   expect(response.status).toBe(401);
   expect(response.cache).toContain("no-store");
   expect(sync).not.toHaveBeenCalled();
  });
 it("rejects missing, wrong, padded and ambiguous Authorization",async()=>{
  for(const bearer of [undefined,"Bearer x","Basic "+validSecret,
    "Bearer "+validSecret+" garbage","Bearer "+validSecret+"\tgarbage","Bearer Bearer "+validSecret]){
   expect((await GET(request({secret:bearer}))).status).toBe(401);
  }
  expect(sync).not.toHaveBeenCalled();
 });
 it("denies browser Origins even when the bearer matches",async()=>{
  for(const origin of ["https://lms.example.test","https://attacker.example.test","null"])
   expect((await GET(request({secret:"Bearer "+validSecret,origin}))).status).toBe(401);
  expect(sync).not.toHaveBeenCalled();
 });
 it("rejects query options and request bodies before readiness and work",async()=>{
  expect((await GET(request({secret:"Bearer "+validSecret,
   url:"https://lms.example.test/api/internal/audit-findings/sync?repo=attacker"}))).status).toBe(400);
  expect((await GET(request({secret:"Bearer "+validSecret,body:"{}"}))).status).toBe(400);
  expect(ready).not.toHaveBeenCalled();
  expect(sync).not.toHaveBeenCalled();
 });
 it("does not disclose importer availability errors or thrown secrets",async()=>{
  ready.mockReturnValue(false);
  const unavailable=await read(await GET(request({secret:"Bearer "+validSecret})));
  expect(unavailable).toEqual({status:503,body:{error:"IMPORTER_NOT_READY"},cache:"private, no-store"});
  ready.mockReturnValue(true);
  sync.mockRejectedValueOnce(new Error("private-db-credential"));
  const failed=await read(await GET(request({secret:"Bearer "+validSecret})));
  expect(failed).toEqual({status:500,body:{error:"IMPORT_FAILED"},cache:"private, no-store"});
  expect(JSON.stringify(failed.body)).not.toContain("private-db-credential");
 });
});
