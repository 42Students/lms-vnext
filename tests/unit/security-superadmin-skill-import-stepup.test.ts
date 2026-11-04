import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
import type {RequestContext} from "@/modules/identity/context";

const fake=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),recent:vi.fn(),import:vi.fn(),curated:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:fake.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:fake.context}));
vi.mock("@/auth/recent-device-auth",
 ()=>({requireRecentDeviceAuthentication:fake.recent}));
vi.mock("@/modules/skills/skill-source-import-service",
 ()=>({reconcileLegacySkillCatalog:fake.import}));
vi.mock("@/modules/skills/curated-synonym-seed-service",
 ()=>({reconcileCuratedSkillSynonyms:fake.curated}));
vi.mock("@/modules/skills/catalog-readiness",
 ()=>({skillsCatalogReadiness:()=>({schemaReplayVerified:true})}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:(error:unknown)=>{
  const reason=error as {code?:string};
  return NextResponse.json({error:reason?.code??"INTERNAL_ERROR"},
   {status:reason?.code?401:500,headers:{"Cache-Control":"private, no-store"}});
 },
}));
import {POST as importSource} from "@/app/api/admin/skills/import/route";
import {POST as seedSynonyms} from "@/app/api/admin/skills/curated-seed/route";

const userId="11111111-1111-4111-8111-111111111111";
const admin:RequestContext={
 user:{id:userId,identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,recruiter:null,
};
const source={format:"CSV",source:"Python,Python,Technical",dryRun:false};
const curated={source:"CURATED_SYNONYMS",dryRun:false};
function request(path:string,body:unknown){
 return new Request("https://platform.test"+path,{
  method:"POST",
  headers:{origin:"https://platform.test",host:"platform.test",
   "content-type":"application/json"},
  body:JSON.stringify(body),
 });
}
const cases=[
 ["canonical source import","/api/admin/skills/import",importSource,source,fake.import],
 ["curated synonym seed","/api/admin/skills/curated-seed",seedSynonyms,curated,fake.curated],
] as const;

beforeEach(()=>{
 vi.resetAllMocks();
 fake.origin.mockReturnValue(true);
 fake.context.mockResolvedValue(admin);
 fake.recent.mockResolvedValue(undefined);
 fake.import.mockResolvedValue({added:1});
 fake.curated.mockResolvedValue({addedSynonyms:1});
});
describe("OTP fresh-auth boundary on global skill catalog mutations",()=>{
 for(const [label,path,handler,body,service] of cases){
  it(label+" rejects a stale session with zero writes",async()=>{
   fake.recent.mockRejectedValueOnce(
    Object.assign(new Error("Step-up required"),{code:"RECENT_SIGN_IN_REQUIRED"}));
   const response=await handler(request(path,body));
   expect(response.status).toBe(401);
   expect((await response.json()).error).toBe("RECENT_SIGN_IN_REQUIRED");
   expect(fake.recent).toHaveBeenCalledWith(userId);
   expect(service).not.toHaveBeenCalled();
  });
  it(label+" rejects foreign origin before session or database work",async()=>{
   fake.origin.mockReturnValue(false);
   const response=await handler(request(path,body));
   expect(response.status).toBe(403);
   expect(fake.context).not.toHaveBeenCalled();
   expect(fake.recent).not.toHaveBeenCalled();
   expect(service).not.toHaveBeenCalled();
  });
  it(label+" permits a fresh Super Admin to reach the persisted-guarded service",async()=>{
   const response=await handler(request(path,body));
   expect(response.status).toBe(200);
   expect(fake.recent).toHaveBeenCalledWith(userId);
   expect(service).toHaveBeenCalledOnce();
  });
 }
 it("tenant-scoped Super Admin cannot seed a global catalog",async()=>{
  const scoped:RequestContext={...admin,adminScope:{
   organizationId:"22222222-2222-4222-8222-222222222222",collegeId:null}};
  fake.context.mockResolvedValue(scoped);
  const response=await seedSynonyms(request("/api/admin/skills/curated-seed",curated));
  expect(response.status).toBe(403);
  expect(fake.recent).not.toHaveBeenCalled();
  expect(fake.curated).not.toHaveBeenCalled();
 });
});
