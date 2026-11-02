import {afterAll,beforeAll,describe,expect,it,vi} from "vitest";

const sessionReads=vi.hoisted(()=>({count:0}));
const dbTouches=vi.hoisted(()=>({count:0}));

vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:vi.fn(async()=>{sessionReads.count++;throw new Error("session must not be read for a cross-origin request");}),
}));
vi.mock("@/db/client",()=>({
 getDb:()=>{dbTouches.count++;throw new Error("database must not be touched for a cross-origin request");},
}));

/**
 * Phase 2 behavioural check: every mutating handler of the TPO/HR/recruiter routes outside the Phase 1 filter
 * answers a cross-origin request with 403 before it reads the session, the body or the database. The static
 * ratchet proves the ordering in source; this proves it by executing each handler.
 */
const routeModules=import.meta.glob("../../src/app/api/**/route.ts") as Record<string,()=>Promise<Record<string,unknown>>>;
const SCOPE=/(tpo|\/hr|recruit)/i;
const PHASE1=/(project|placement)/i;
const METHODS=["POST","PUT","PATCH","DELETE"] as const;
const scoped=Object.entries(routeModules).filter(([p])=>SCOPE.test(p)&&!PHASE1.test(p)).sort(([a],[b])=>a.localeCompare(b));

const UUID="00000000-0000-4000-8000-000000000000";
const params=()=>Promise.resolve(new Proxy({}, {get:()=>UUID}));

function crossOrigin(method:string){
 return new Request("https://college.example/api/x",{
  method,
  headers:{origin:"https://evil.example",host:"college.example","content-type":"application/json"},
  body:"{}",
 });
}
function noOrigin(method:string){
 return new Request("https://college.example/api/x",{
  method,headers:{host:"college.example","content-type":"application/json"},body:"{}",
 });
}

async function mutatingHandlers(){
 const out:{file:string;method:string;handler:(r:Request,c:unknown)=>Promise<Response>}[]=[];
 for(const [file,load] of scoped){
  const mod=await load();
  for(const m of METHODS){
   const h=mod[m];
   if(typeof h==="function")out.push({file:file.replace("../../",""),method:m,handler:h as (r:Request,c:unknown)=>Promise<Response>});
  }
 }
 return out;
}

describe("PHASE2-XORIGIN cross-origin mutating requests are rejected before any work",()=>{
 beforeAll(()=>{vi.stubEnv("DB09_TPO_API_READY","DB09_VERIFIED");});
 afterAll(()=>{vi.unstubAllEnvs();});

 it("PHASE2-XORIGIN-01 discovers the mutating handler surface",async()=>{
  const handlers=await mutatingHandlers();
  expect(scoped.length).toBeGreaterThanOrEqual(28);
  expect(handlers.length).toBeGreaterThanOrEqual(16);
 },120000);

 it("PHASE2-XORIGIN-02 a cross-origin request gets 403 and never reaches the session or the database",async()=>{
  const handlers=await mutatingHandlers();
  const failures:string[]=[];
  for(const {file,method,handler} of handlers){
   sessionReads.count=0;dbTouches.count=0;
   const request=crossOrigin(method);
   let status:number|string="no response";
   try{
    const response=await handler(request,{params:params()});
    status=response.status;
   }catch(error){
    status="threw: "+(error instanceof Error?error.message:String(error));
   }
   if(status!==403||sessionReads.count>0||dbTouches.count>0||request.bodyUsed)
    failures.push(`${file} ${method}: status=${status} session=${sessionReads.count} db=${dbTouches.count} bodyRead=${request.bodyUsed}`);
  }
  expect(failures).toEqual([]);
 },120000);

 it("PHASE2-XORIGIN-03 a request with no Origin header is rejected the same way",async()=>{
  const handlers=await mutatingHandlers();
  const failures:string[]=[];
  for(const {file,method,handler} of handlers){
   sessionReads.count=0;dbTouches.count=0;
   const request=noOrigin(method);
   let status:number|string="no response";
   try{status=(await handler(request,{params:params()})).status;}
   catch(error){status="threw: "+(error instanceof Error?error.message:String(error));}
   if(status!==403||sessionReads.count>0||dbTouches.count>0||request.bodyUsed)
    failures.push(`${file} ${method}: status=${status} session=${sessionReads.count} db=${dbTouches.count}`);
  }
  expect(failures).toEqual([]);
 },120000);

 it("PHASE2-XORIGIN-04 the 403 body names INVALID_ORIGIN and leaks nothing about the resource",async()=>{
  const handlers=await mutatingHandlers();
  for(const {file,method,handler} of handlers){
   const response=await handler(crossOrigin(method),{params:params()});
   const text=await response.text();
   expect(/INVALID_ORIGIN|could not be verified|forbidden/i.test(text),`${file} ${method}: ${text.slice(0,120)}`).toBe(true);
   expect(text.includes(UUID),`${file} ${method} echoes the id`).toBe(false);
  }
 },120000);
 it("PHASE2-XORIGIN-05 with the DB09 readiness gate off, gated routes answer 503 DB09_MIGRATIONS_PENDING or 403 and never touch the session or database",async()=>{
  vi.stubEnv("DB09_TPO_API_READY","");
  try{
   const handlers=await mutatingHandlers();
   const failures:string[]=[];
   let gated=0;
   for(const {file,method,handler} of handlers){
    sessionReads.count=0;dbTouches.count=0;
    const request=crossOrigin(method);
    let status:number|string="no response";
    let text="";
    try{const r=await handler(request,{params:params()});status=r.status;text=await r.text();}
    catch(error){status="threw: "+(error instanceof Error?error.message:String(error));}
    if(status===503&&text.includes("DB09_MIGRATIONS_PENDING"))gated++;
    else if(status!==403)failures.push(`${file} ${method}: status=${status}`);
    if(sessionReads.count>0||dbTouches.count>0||request.bodyUsed)failures.push(`${file} ${method}: did work while gated`);
   }
   expect(failures).toEqual([]);
   expect(gated).toBeGreaterThanOrEqual(3);
  }finally{
   vi.stubEnv("DB09_TPO_API_READY","DB09_VERIFIED");
  }
 },120000);
});
