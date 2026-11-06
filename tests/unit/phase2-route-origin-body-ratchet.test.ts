import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";

/**
 * Phase 2 ratchet for TPO/HR/recruiter routes outside the Phase 1 path filter: every browser-facing mutating
 * handler checks same-origin (or goes through the shared login guard that does) BEFORE reading the body,
 * resolving the session or reading params, and no route may add an unbounded request.json().
 */
const SCOPE=/(tpo|\/hr|recruit)/i;
const PHASE1=/(project|placement)/i;
const HANDLER=/export\s+(?:async\s+function\s+(POST|PUT|PATCH|DELETE)\b|const\s+(POST|PUT|PATCH|DELETE)\s*=)|async\s+function\s+handle(POST|PUT|PATCH|DELETE)\b/g;
const NEXT_HANDLER=/\nexport\s+(?:async\s+function|const)\s+(?:GET|POST|PUT|PATCH|DELETE)\b/;
const ORIGIN=/isSameOriginRequest\(|guardLoginRequest\(|\broute\(\s*\{/;
const FIRST_WORK=/\.json\(\)|readBounded\w*\(|formData\(\)|\.text\(\)|getCurrentRequestContext\(|await\s+params|await\s+route\.params|await\s+context\.params/;
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
const files=walk(path.join(process.cwd(),"src","app","api")).map(rel)
 .filter(f=>f.endsWith("/route.ts")&&SCOPE.test(f)&&!PHASE1.test(f)).sort();
const read=(f:string)=>fs.readFileSync(path.join(process.cwd(),f),"utf8");

type Handler={file:string;method:string;text:string};
const handlers:Handler[]=[];
for(const f of files){
 const src=read(f);
 HANDLER.lastIndex=0;
 let m:RegExpExecArray|null;
 while((m=HANDLER.exec(src))){
  const rest=src.slice(m.index);
  const next=rest.slice(10).search(NEXT_HANDLER);
  const text=next<0?rest:rest.slice(0,next+10);
  // The central `secured(handleX)` export line is not a handler body; the `handleX` function above it is.
  if(/^export\s+const\s+\w+\s*=\s*secured\(/.test(text.trim()))continue;
  handlers.push({file:f,method:(m[1]??m[2]??m[3])!,text});
 }
}

const fixture=JSON.parse(fs.readFileSync(path.join(process.cwd(),"tests","fixtures","phase2-unbounded-json-routes.json"),"utf8")) as {routes:string[]};
const frozen=new Set(fixture.routes);
const current=files.filter(f=>UNBOUNDED.test(read(f)));

describe("PHASE2-ORIGIN mutating handler ordering ratchet",()=>{
 it("PHASE2-ORIGIN-01 discovers the mutating handler surface",()=>{
  expect(handlers.length).toBeGreaterThanOrEqual(16);
 });

 it("PHASE2-ORIGIN-02 every mutating handler checks same-origin or uses the shared login guard",()=>{
  const missing=handlers.filter(h=>!ORIGIN.test(h.text)).map(h=>`${h.file} ${h.method}`);
  expect(missing).toEqual([]);
 });

 it("PHASE2-ORIGIN-03 the origin check precedes reading the body, resolving the session and reading params",()=>{
  const wrong=handlers.filter(h=>{
   const origin=h.text.search(ORIGIN);
   const work=h.text.search(FIRST_WORK);
   return origin>=0&&work>=0&&work<origin;
  }).map(h=>`${h.file} ${h.method}`);
  expect(wrong).toEqual([]);
 });

 it("PHASE2-ORIGIN-04 a failed origin check returns 403 INVALID_ORIGIN and never falls through",()=>{
  for(const h of handlers){
   const idx=h.text.search(/isSameOriginRequest\(/);
   if(idx<0)continue;
   expect(/INVALID_ORIGIN|403|Forbidden|forbidden/.test(h.text.slice(idx,idx+450)),`${h.file} ${h.method}`).toBe(true);
  }
 });

 it("PHASE2-ORIGIN-05 no GET handler performs a write through a mutating-looking service call",()=>{
  const WRITE_CALL=/\b(create|update|delete|remove|save|apply|archive|reopen|merge|withdraw|revoke|publish|cancel|clone|undo|assign|reassign|submit|approve|reject|restore|undelete|grant|terminate|decide)[A-Z]\w*\(/;
  const offenders:string[]=[];
  for(const f of files){
   const src=read(f);
   const m=/export\s+(?:async\s+function|const)\s+GET\b|async\s+function\s+handleGET\b/.exec(src);
   if(!m)continue;
   const rest=src.slice(m.index);
   const next=rest.slice(10).search(NEXT_HANDLER);
   const text=next<0?rest:rest.slice(0,next+10);
   const call=WRITE_CALL.exec(text);
   if(call)offenders.push(`${f} -> ${call[0]}`);
  }
  expect(offenders).toEqual([]);
 });
});

describe("PHASE2-BODY request body size ratchet",()=>{
 it("PHASE2-BODY-01 no new TPO/HR/recruiter route parses an unbounded request.json()",()=>{
  expect(current.filter(f=>!frozen.has(f)),"use readBoundedJsonRequest instead of request.json()").toEqual([]);
 });

 it("PHASE2-BODY-02 every frozen entry still exists and still parses unbounded (remove entries as routes are fixed)",()=>{
  expect([...frozen].filter(f=>!current.includes(f))).toEqual([]);
 });

 it("PHASE2-BODY-03 the frozen list is sorted, unique and only names in-scope route files",()=>{
  expect(fixture.routes).toEqual([...new Set(fixture.routes)].sort());
  for(const f of fixture.routes){
   expect(f.startsWith("src/app/api/")&&f.endsWith("/route.ts"),f).toBe(true);
   expect(SCOPE.test(f)&&!PHASE1.test(f),f).toBe(true);
  }
 });

 it("PHASE2-BODY-04 routes that use a bounded reader never also call request.json()",()=>{
  for(const f of files){
   const src=read(f);
   if(/readBoundedJsonRequest|readBoundedUtf8|readBoundedBody|readBoundedAuthJson|readPublicRecruitEnquiryBody/.test(src))
    expect(UNBOUNDED.test(src),`${f} mixes a bounded reader with request.json()`).toBe(false);
  }
 });

 it("PHASE2-BODY-05 every unbounded frozen route validates the parsed body with a schema in the route or in the service it hands the raw body to",()=>{
  const moduleFile=(spec:string)=>{
   const base=path.join(process.cwd(),"src",spec.replace(/^@\//,""));
   return [base+".ts",path.join(base,"index.ts")].find(p=>fs.existsSync(p));
  };
  for(const f of fixture.routes){
   const src=read(f);
   if(/\.(?:parse|safeParse)\(/.test(src))continue;
   const imports=[...src.matchAll(/from\s*["'](@\/modules\/[^"']+)["']/g)].map(m=>moduleFile(m[1]!)).filter((p):p is string=>Boolean(p));
   const validated=imports.some(p=>/\.(?:parse|safeParse)\(/.test(fs.readFileSync(p,"utf8")));
   expect(validated,`${f} hands an unvalidated body to a service that never parses it`).toBe(true);
  }
 });
});
