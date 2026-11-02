import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";

/**
 * Phase 2 ratchet: every page under /tpo, /hr, /recruiter and /admin/placements must be protected. A page is
 * protected when it (or a page or component it re-exports or renders) calls the request context, or when the
 * nearest ancestor layout up to its portal root does. No page may be an empty stub that ships unguarded.
 */
const ROOT=path.join(process.cwd(),"src","app","(authenticated)");
const PORTALS=["tpo","hr","recruiter","admin/placements"];
const GUARD=/getCurrentRequestContext|requireRequestContext|requireRole|requireCollegeScope|requireSuperAdmin|canOpen\w+\(|redirect\(/;
const STUB=/return\s*<div\s*\/>\s*;?\s*\}|return\s*<>\s*<\/>\s*;?\s*\}|return\s+null\s*;?\s*\}/;
const ALIAS_PAGE=/from\s*["']@\/app\/\(authenticated\)\/([^"']+?)(?:\/page)?["']/;

function walk(dir:string,out:string[]=[]):string[]{
 if(!fs.existsSync(dir))return out;
 for(const name of fs.readdirSync(dir)){
  const full=path.join(dir,name);
  if(fs.statSync(full).isDirectory())walk(full,out);
  else out.push(full);
 }
 return out;
}
const rel=(f:string)=>path.relative(process.cwd(),f).split(path.sep).join("/");
const read=(f:string)=>fs.readFileSync(f,"utf8");
const pages=PORTALS.flatMap(p=>walk(path.join(ROOT,p))).filter(f=>f.endsWith(`${path.sep}page.tsx`));

function layoutGuarded(pageFile:string,portalRoot:string):boolean{
 let dir=path.dirname(pageFile);
 while(dir.length>=portalRoot.length){
  const layout=path.join(dir,"layout.tsx");
  if(fs.existsSync(layout)&&GUARD.test(read(layout)))return true;
  if(dir===portalRoot)break;
  dir=path.dirname(dir);
 }
 return false;
}
function pageGuarded(file:string,seen=new Set<string>()):boolean{
 const src=read(file);
 if(GUARD.test(src))return true;
 if(seen.has(file))return false;
 seen.add(file);
 const m=ALIAS_PAGE.exec(src);
 if(!m)return false;
 const target=path.join(ROOT,...m[1]!.split("/"),"page.tsx");
 return fs.existsSync(target)&&pageGuarded(target,seen);
}
const portalRootOf=(f:string)=>{
 const p=PORTALS.find(x=>f.startsWith(path.join(ROOT,x)+path.sep))!;
 return path.join(ROOT,p);
};

describe("PHASE2-PAGE TPO/HR/recruiter page protection ratchet",()=>{
 it("PHASE2-PAGE-01 discovers the portal page surface",()=>{
  expect(pages.length).toBeGreaterThanOrEqual(200);
  for(const p of PORTALS)expect(pages.some(f=>f.includes(path.join("(authenticated)",...p.split("/")))),p).toBe(true);
 });

 it("PHASE2-PAGE-02 every page is guarded in its own file, through an aliased page, or by an ancestor layout",()=>{
  const open=pages.filter(f=>!pageGuarded(f)&&!layoutGuarded(f,portalRootOf(f))).map(rel);
  expect(open).toEqual([]);
 });

 it("PHASE2-PAGE-03 no page is an empty stub",()=>{
  const stubs=pages.filter(f=>{
   const src=read(f);
   return src.length<500&&STUB.test(src);
  }).map(rel);
  expect(stubs).toEqual([]);
 });

 it("PHASE2-PAGE-04 each portal root layout guards the whole portal with a redirect for denied roles",()=>{
  for(const p of ["tpo","hr","recruiter"]){
   const layout=path.join(ROOT,p,"layout.tsx");
   expect(fs.existsSync(layout),p).toBe(true);
   const src=read(layout);
   expect(/getCurrentRequestContext\(/.test(src),`${p} layout`).toBe(true);
   expect(/redirect\(/.test(src),`${p} layout`).toBe(true);
  }
 });

 it("PHASE2-PAGE-05 recruiter pages alias the HR pages instead of duplicating privileged logic",()=>{
  const recruiter=pages.filter(f=>f.startsWith(path.join(ROOT,"recruiter")+path.sep));
  expect(recruiter.length).toBeGreaterThan(10);
  for(const f of recruiter){
   const src=read(f);
   const lines=src.split("\n").length;
   expect(/\(authenticated\)\/(hr|recruiter)\//.test(src)||GUARD.test(src),rel(f)).toBe(true);
   expect(lines,`${rel(f)} is large; privileged recruiter logic belongs behind the shared HR page`).toBeLessThan(80);
  }
 });
});
