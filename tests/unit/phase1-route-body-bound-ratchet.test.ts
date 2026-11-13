import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";
import {readBoundedJsonRequest} from "@/lib/request-body";

/**
 * Phase 1 ratchet for request-body limits. Routes that call request.json() read an unbounded body.
 * The fixture freezes today's list: a new route may not join it, and an entry must be removed once
 * its route moves to a bounded reader (readBoundedJsonRequest and friends).
 */
const fixture=JSON.parse(fs.readFileSync(path.join(process.cwd(),"tests","fixtures","phase1-unbounded-json-routes.json"),"utf8")) as {routes:string[]};
const frozen=new Set(fixture.routes);
const UNBOUNDED=/\b(?:request|req)\.json\(\)/;

function walk(dir:string,out:string[]=[]):string[]{
 for(const name of fs.readdirSync(dir)){
  const full=path.join(dir,name);
  if(fs.statSync(full).isDirectory())walk(full,out);
  else out.push(full);
 }
 return out;
}
const rel=(f:string)=>path.relative(process.cwd(),f).split(path.sep).join("/");
const routes=walk(path.join(process.cwd(),"src","app","api"))
 .map(rel).filter(f=>f.endsWith("/route.ts")&&/(project|placement)/i.test(f)).sort();
const current=routes.filter(f=>UNBOUNDED.test(fs.readFileSync(path.join(process.cwd(),f),"utf8")));

describe("PHASE1-BODY request body size ratchet",()=>{
 it("PHASE1-BODY-01 no new project or placement route parses an unbounded request.json()",()=>{
  const added=current.filter(f=>!frozen.has(f));
  expect(added,"new routes must use readBoundedJsonRequest (or another bounded reader), not request.json()").toEqual([]);
 });

 it("PHASE1-BODY-02 every frozen entry still exists and still parses unbounded (remove entries as routes are fixed)",()=>{
  const stale=[...frozen].filter(f=>!current.includes(f));
  expect(stale,"these routes no longer use request.json(); delete them from tests/fixtures/phase1-unbounded-json-routes.json").toEqual([]);
 });

 it("PHASE1-BODY-03 the frozen list is sorted, unique and only names route files in scope",()=>{
  expect(fixture.routes).toEqual([...new Set(fixture.routes)].sort());
  for(const f of fixture.routes){
   expect(f.startsWith("src/app/api/")&&f.endsWith("/route.ts"),f).toBe(true);
   expect(/(project|placement)/i.test(f),f).toBe(true);
  }
 });

 it("PHASE1-BODY-04 routes that already use a bounded reader never also call request.json()",()=>{
  for(const f of routes){
   const src=fs.readFileSync(path.join(process.cwd(),f),"utf8");
   if(/readBoundedJsonRequest|readBoundedUtf8|readBoundedBody/.test(src))
    expect(UNBOUNDED.test(src),`${f} mixes a bounded reader with an unbounded request.json()`).toBe(false);
  }
 });
});

function jsonRequest(body:string|Uint8Array,headers:Record<string,string>={}){
 return new Request("https://college.example/api/x",{method:"POST",headers:{"content-type":"application/json",...headers},body:body as BodyInit});
}

describe("PHASE1-BODY-READER the shared bounded reader enforces real byte limits",()=>{
 it("PHASE1-BODY-READER-01 accepts a JSON body at exactly the limit",async()=>{
  const body=JSON.stringify({a:"x".repeat(20)});
  const bytes=new TextEncoder().encode(body).byteLength;
  expect(await readBoundedJsonRequest(jsonRequest(body),bytes)).toEqual({ok:true,value:{a:"x".repeat(20)}});
 });

 it("PHASE1-BODY-READER-02 rejects a body one byte over the limit even without a content-length header",async()=>{
  const body=JSON.stringify({a:"x".repeat(20)});
  const bytes=new TextEncoder().encode(body).byteLength;
  expect(await readBoundedJsonRequest(jsonRequest(body),bytes-1)).toEqual({ok:false});
 });

 it("PHASE1-BODY-READER-03 rejects a lying small content-length when the streamed bytes exceed the limit",async()=>{
  const body=JSON.stringify({a:"x".repeat(500)});
  expect(await readBoundedJsonRequest(jsonRequest(body,{"content-length":"5"}),100)).toEqual({ok:false});
 });

 it("PHASE1-BODY-READER-04 rejects malformed, negative, decimal, huge and hex content-length declarations",async()=>{
  for(const declared of ["abc","-1","1.5","0x10","99999999999999999999","01"])
   expect(await readBoundedJsonRequest(jsonRequest("{}",{"content-length":declared}),1024),declared).toEqual({ok:false});
 });

 it("PHASE1-BODY-READER-05 rejects a declared length above the limit before reading the stream",async()=>{
  expect(await readBoundedJsonRequest(jsonRequest("{}",{"content-length":"2048"}),1024)).toEqual({ok:false});
 });

 it("PHASE1-BODY-READER-06 rejects empty bodies, invalid JSON and invalid UTF-8",async()=>{
  expect(await readBoundedJsonRequest(new Request("https://x.example/api",{method:"POST"}),1024)).toEqual({ok:false});
  expect(await readBoundedJsonRequest(jsonRequest("{not json"),1024)).toEqual({ok:false});
  expect(await readBoundedJsonRequest(jsonRequest(new Uint8Array([0x7b,0x22,0xff,0xfe,0x22,0x3a,0x31,0x7d])),1024)).toEqual({ok:false});
 });

 it("PHASE1-BODY-READER-07 rejects invalid limits instead of treating them as unlimited",async()=>{
  for(const limit of [0,-1,1.5,Number.NaN,Number.POSITIVE_INFINITY,Number.MAX_SAFE_INTEGER+2])
   expect(await readBoundedJsonRequest(jsonRequest("{}"),limit),String(limit)).toEqual({ok:false});
 });

 it("PHASE1-BODY-READER-08 counts bytes, not characters, for multibyte content",async()=>{
  const body=JSON.stringify({a:"€".repeat(10)});
  const bytes=new TextEncoder().encode(body).byteLength;
  expect(bytes).toBeGreaterThan(body.length);
  expect(await readBoundedJsonRequest(jsonRequest(body),body.length)).toEqual({ok:false});
  expect((await readBoundedJsonRequest(jsonRequest(body),bytes)).ok).toBe(true);
 });
});
