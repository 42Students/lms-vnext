import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
const m=vi.hoisted(()=>({
 origin:vi.fn(),session:vi.fn(),schema:vi.fn(),ready:vi.fn(),
 admin:vi.fn(),access:vi.fn(),db:vi.fn(),read:vi.fn(),
 record:vi.fn(),invalidate:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:m.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.session}));
vi.mock("@/db/client",()=>({getDb:m.db}));
vi.mock("@/modules/identity/context",()=>({isSuperAdmin:m.admin}));
vi.mock("@/modules/skills/catalog-access",()=>({canReadSkillCatalog:m.access}));
vi.mock("@/modules/skills/catalog-readiness",()=>({
 skillsCatalogSchemaReady:m.schema,skillsCatalogRuntimeEnabled:m.ready,
 skillsCatalogReadiness:()=>({ready:true}),
}));
vi.mock("@/modules/skills/catalog-service",()=>({
 readSkillCatalog:m.read,recordSkillSelection:m.record,
 invalidateSkillCatalogSearchCache:m.invalidate,
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>NextResponse.json({error:"SAFE_FAILURE"},{status:400}),
}));
import {GET,POST} from "@/app/api/skills/route";
const base="https://college.example.test";
const active={user:{id:"11111111-1111-4111-8111-111111111111",platformStatus:"ACTIVE"}};
const post=(body:string)=>new Request(base+"/api/skills",{
 method:"POST",headers:{host:"college.example.test",origin:base,
  "content-type":"application/json"},body,
});
const get=(query:string)=>new Request(base+"/api/skills"+query);
beforeEach(()=>{
 vi.clearAllMocks();
 m.origin.mockReturnValue(true);
 m.schema.mockReturnValue(true);
 m.ready.mockReturnValue(true);
 m.session.mockResolvedValue(active);
 m.admin.mockReturnValue(false);
 m.access.mockReturnValue(true);
 m.read.mockResolvedValue({items:[{name:"java"}],categories:[]});
});
describe("skills API payload and query isolation",()=>{
 it("denies cross-site writes before resolving identity",async()=>{
  m.origin.mockReturnValue(false);
  expect((await POST(post('{"action":"SELECT_V2","name":"SQL"}'))).status).toBe(403);
  expect(m.session).not.toHaveBeenCalled();
 });
 it("caps actual streamed import bytes even with a misleading length header",async()=>{
  const req=post(JSON.stringify({action:"IMPORT_SKILLS",items:[],
    filler:"z".repeat(1024*1024)}));
  req.headers.set("content-length","1");
  const res=await POST(req);
  expect(res.status).toBe(413);
  expect(res.headers.get("cache-control")).toContain("no-store");
  expect(m.db).not.toHaveBeenCalled();
 });
 it("rejects malformed JSON before mutation",async()=>{
  expect((await POST(post("{"))).status).toBe(400);
  expect(m.db).not.toHaveBeenCalled();
 });
 it("rejects import for a non-platform administrator",async()=>{
  const payload={action:"IMPORT_SKILLS",
   items:[{name:"Java",displayName:"Java",category:"language"}]};
  expect((await POST(post(JSON.stringify(payload)))).status).toBe(403);
  expect(m.db).not.toHaveBeenCalled();
 });
 it("preserves a bounded platform-authorized import",async()=>{
  m.admin.mockReturnValue(true);
  const tx={insert:vi.fn().mockReturnValue({
   values:()=>({onConflictDoNothing:()=>({
    returning:()=>Promise.resolve([{id:"one"}]),
   })}),
  })};
  m.db.mockReturnValue({transaction:(fn:(arg:typeof tx)=>Promise<unknown>)=>fn(tx)});
  const res=await POST(post(JSON.stringify({action:"IMPORT_SKILLS",
   items:[{name:"Java",displayName:"Java",category:"language"}]})));
  expect(res.status).toBe(200);
  expect((await res.json()).created).toBe(1);
  expect(m.invalidate).toHaveBeenCalledOnce();
 });
 it.each(["?mode=stats&mode=search","?compat=v1&compat=v2",
  "?skillName=x&skillName=y","?limit=10&limit=20",
  "?category=a&category=b"])(
  "denies conflicting search parameters %s before identity",async query=>{
   const res=await GET(get(query));
   expect(res.status).toBe(400);
   expect(res.headers.get("cache-control")).toContain("no-store");
   expect(m.session).not.toHaveBeenCalled();
  });
 it("denies cross-college usage stats to a College Admin",async()=>{
  const res=await GET(get("?mode=stats"));
  expect(res.status).toBe(403);
  expect(res.headers.get("cache-control")).toContain("no-store");
  expect(m.db).not.toHaveBeenCalled();
 });
 it("denies global stats to a suspended Super Admin",async()=>{
  m.admin.mockReturnValue(true);
  m.session.mockResolvedValue({user:{...active.user,platformStatus:"SUSPENDED"}});
  expect((await GET(get("?mode=stats"))).status).toBe(403);
  expect(m.db).not.toHaveBeenCalled();
 });
 it("permits an active Super Admin to inspect global counts",async()=>{
  m.admin.mockReturnValue(true);
  let n=0;
  m.db.mockReturnValue({select:()=>{
   const rows=Promise.resolve([{total:[3,2,17][n++]}]);
   return {from:()=>({where:()=>rows,then:rows.then.bind(rows)})};
  }});
  const res=await GET(get("?mode=stats"));
  expect(res.status).toBe(200);
  expect((await res.json()).popularSkillsTracked).toBe(17);
 });
 it("preserves ordinary authenticated catalog search",async()=>{
  const res=await GET(get("?mode=search&query=java&limit=15"));
  expect(res.status).toBe(200);
  expect(m.read).toHaveBeenCalledWith(expect.objectContaining({
   mode:"search",query:"java",limit:15,
  }));
  expect(m.db).not.toHaveBeenCalled();
 });
});
