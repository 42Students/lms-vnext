import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";

/**
 * Phase 1 ratchet on the order of work inside mutating route handlers. The same-origin check must run
 * before the body is read, before the session is resolved and before any service call, so a cross-site
 * request is rejected without reading attacker-controlled input or touching the database.
 * Secret-authenticated internal workers and `export const X=Y` aliases are handled separately.
 */
const SCOPE=/(project|placement)/i;
const HANDLER=/export\s+(?:async\s+function\s+(POST|PUT|PATCH|DELETE)\b|const\s+(POST|PUT|PATCH|DELETE)\s*=)|async\s+function\s+handle(POST|PUT|PATCH|DELETE)\b/g;
const NEXT_HANDLER=/\nexport\s+(?:async\s+function|const)\s+(?:GET|POST|PUT|PATCH|DELETE)\b/;
const FIRST_WORK=/\.json\(\)|readBounded\w*\(|formData\(\)|\.text\(\)|getCurrentRequestContext\(|await\s+params|await\s+route\.params|await\s+context\.params/;

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
 .filter(f=>f.endsWith("/route.ts")&&SCOPE.test(f));

/** Exact body of the function or arrow handler starting at index (brace matched, skipping the parameter list). */
function functionBody(src:string,index:number):string{
 const open=src.indexOf("(",index);
 let depth=0,i=open;
 for(;i<src.length;i++){
  if(src[i]==="(")depth++;
  else if(src[i]===")"){depth--;if(depth===0)break;}
 }
 let angle=0,start=-1;
 for(let j=i+1;j<src.length;j++){
  const c=src[j]!;
  if(c==="<")angle++;
  else if(c===">"&&src[j-1]!=="=")angle=Math.max(0,angle-1);
  else if(c==="{"&&angle===0){start=j;break;}
 }
 if(start<0)return "";
 let d=0;
 for(let k=start;k<src.length;k++){
  if(src[k]==="{")d++;
  else if(src[k]==="}"){d--;if(d===0)return src.slice(start,k+1);}
 }
 return src.slice(start);
}

type Handler={file:string;method:string;text:string;alias:boolean;shim:boolean};
const handlers:Handler[]=[];
for(const f of files){
 const src=fs.readFileSync(path.join(process.cwd(),f),"utf8");
 HANDLER.lastIndex=0;
 let m:RegExpExecArray|null;
 while((m=HANDLER.exec(src))){
  const rest=src.slice(m.index);
  const next=rest.slice(10).search(NEXT_HANDLER);
  const text=next<0?rest:rest.slice(0,next+10);
  // `export const X = secured(handleX)` is the central wrapper; the handler body is the `handleX` function above it.
  const shim=/^export\s+const\s+\w+\s*=\s*secured\(\s*handle/.test(text.trim());
  handlers.push({file:f,method:(m[1]??m[2]??m[3])!,text,shim,alias:/^export\s+const\s+\w+\s*=\s*(?:secured\(\s*)?(?:POST|PUT|PATCH|DELETE|GET)\b/.test(text.trim().split("\n")[0]!.trim())||/^export\s+const\s+\w+\s*=\s*\w+\s*;?\s*$/.test(text.trim().split("\n")[0]!.trim())});
 }
}
const INTERNAL=(h:Handler)=>h.file.includes("/api/internal/");
const subject=handlers.filter(h=>!h.alias&&!h.shim&&!INTERNAL(h));

describe("PHASE1-ORIGIN mutating handler ordering ratchet",()=>{
 it("PHASE1-ORIGIN-01 discovers the mutating handler surface",()=>{
  expect(handlers.length).toBeGreaterThan(350);
  expect(subject.length).toBeGreaterThan(340);
 });

 it("PHASE1-ORIGIN-02 every browser-facing mutating handler checks same-origin",()=>{
  const missing=subject.filter(h=>!/isSameOriginRequest\(|\broute\(\s*\{/.test(h.text)).map(h=>`${h.file} ${h.method}`);
  expect(missing).toEqual([]);
 });

 it("PHASE1-ORIGIN-03 the origin check precedes reading the body, resolving the session and reading route params",()=>{
  const wrong=subject.filter(h=>{
   const origin=h.text.search(/isSameOriginRequest\(/);
   const work=h.text.search(FIRST_WORK);
   return origin>=0&&work>=0&&work<origin;
  }).map(h=>`${h.file} ${h.method}`);
  expect(wrong).toEqual([]);
 });

 it("PHASE1-ORIGIN-04 a failed origin check returns 403 INVALID_ORIGIN and never falls through",()=>{
  for(const h of subject){
   const idx=h.text.search(/isSameOriginRequest\(/);
   if(idx<0&&/\broute\(\s*\{/.test(h.text)&&!/csrf:\s*false/.test(h.text))continue;
   const window=h.text.slice(idx,idx+400);
   expect(/INVALID_ORIGIN|403|Forbidden|forbidden/.test(window),`${h.file} ${h.method}`).toBe(true);
  }
 });

 it("PHASE1-ORIGIN-05 every alias handler points at a handler defined in the same file that checks origin",()=>{
  const aliases=handlers.filter(h=>h.alias);
  expect(aliases.length).toBeGreaterThan(0);
  for(const a of aliases){
   const target=/=\s*(?:secured\(\s*)?(\w+)/.exec(a.text.split("\n")[0]!)![1]!;
   const src=fs.readFileSync(path.join(process.cwd(),a.file),"utf8");
   const def=handlers.find(h=>h.file===a.file&&h.method===target&&!h.alias);
   expect(def,`${a.file} alias ${a.method}=${target} has no handler in the same file (${src.length}b)`).toBeDefined();
   // route() performs the origin check centrally before the handler runs.
   const centralOrigin=/^export\s+const\s+\w+\s*=\s*route\(/.test(def!.text.trim());
   expect(centralOrigin||/isSameOriginRequest\(/.test(def!.text),`${a.file} ${target}`).toBe(true);
  }
 });

 it("PHASE1-ORIGIN-06 internal mutating workers are the only handlers without an origin check and authenticate with a secret",()=>{
  const internal=handlers.filter(h=>INTERNAL(h)&&!h.shim);
  expect(internal.length).toBeGreaterThan(3);
  for(const h of internal.filter(x=>!/isSameOriginRequest\(/.test(x.text)))
   expect(/timingSafeEqual|signature|authorization|x-[a-z-]+-key|internalRoute\(/i.test(h.text),`${h.file} ${h.method}`).toBe(true);
 });

 it("PHASE1-ORIGIN-07 no GET handler in scope performs a write through a mutating-looking service call",()=>{
  const WRITE_CALL=/\b(create|update|delete|remove|save|apply|archive|reopen|merge|withdraw|revoke|publish|cancel|clone|undo|assign|reassign|submit|approve|reject|ship|unship|restore|undelete)[A-Z]\w*\(/;
  const READ_ONLY_REASONS:Record<string,string>={
   "src/app/api/placements/learner/jobs/[jobId]/job-description/route.ts":
    "createPrivateReadGrant signs a short-lived private read URL for a document the learner may read; no persisted state change",
  };
  const offenders:string[]=[];
  for(const f of files){
   const src=fs.readFileSync(path.join(process.cwd(),f),"utf8");
   const m=/export\s+(?:async\s+function\s+GET\b|const\s+GET\s*=\s*async)|async\s+function\s+handleGET\b/.exec(src);
   if(!m)continue;
   const text=functionBody(src,m.index);
   const call=WRITE_CALL.exec(text);
   if(call&&!(f in READ_ONLY_REASONS))offenders.push(`${f} -> ${call[0]}`);
  }
  expect(offenders,"GET handlers must not call write-named services; add a documented read-only reason if the name is misleading").toEqual([]);
 });
});
