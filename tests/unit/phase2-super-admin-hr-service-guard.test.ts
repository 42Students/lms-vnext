import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";

/**
 * Phase 2: every exported function of the super-admin HR service that takes the request context must check a
 * persisted platform permission or super-admin status inside its own body. This closes the ledger gap for
 * revokeSuperAdminHrCollegeAccess, terminateSuperAdminHrSessions and the rest of the HR account management surface.
 */
const FILE=path.join(process.cwd(),"src","modules","placements","super-admin-hr-service.ts");
const src=fs.readFileSync(FILE,"utf8");

const PERSISTED=/assertPersistedPlatformPermission\(/;
const FIRST_STATEMENT=/^\{\s*requireHrAdmin\(context\);/;
const MUTATING=/^(create|update|grant|revoke|terminate)/;

function closeBrace(text:string,open:number):number{
 let depth=0;
 for(let i=open;i<text.length;i++){
  if(text[i]==="{")depth++;
  else if(text[i]==="}"){depth--;if(depth===0)return i;}
 }
 return -1;
}
function bodyOf(index:number):string{
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
 return start<0?"":src.slice(start,closeBrace(src,start)+1);
}

const functions=[...src.matchAll(/export\s+async\s+function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)/g)]
 .map(m=>({name:m[1]!,params:m[2]!,index:m.index!,body:bodyOf(m.index!)}))
 .filter(f=>/context/i.test(f.params));

describe("PHASE2-SAHR super-admin HR service permission guard",()=>{
 it("PHASE2-SAHR-01 discovers the exported context-taking service surface",()=>{
  const names=functions.map(f=>f.name);
  for(const n of ["listSuperAdminHrAccounts","getSuperAdminHrAccount","createSuperAdminHrAccount","updateSuperAdminHrAccount",
   "grantSuperAdminHrCollegeAccess","revokeSuperAdminHrCollegeAccess","terminateSuperAdminHrSessions"])
   expect(names,n).toContain(n);
 });

 it("PHASE2-SAHR-02 every function starts with requireHrAdmin(context), the super-admin-only admin-scope permission",()=>{
  const bad=functions.filter(f=>!FIRST_STATEMENT.test(f.body)).map(f=>f.name);
  expect(bad).toEqual([]);
 });

 it("PHASE2-SAHR-03 requireHrAdmin demands the admin-scope.select permission and nothing weaker",()=>{
  const m=/function requireHrAdmin\(context:\s*RequestContext\)\s*\{[\s\S]*?\n\}/.exec(src);
  expect(m).not.toBeNull();
  expect(/requirePermission\(\s*context,\s*"admin-scope\.select"/.test(m![0])).toBe(true);
 });

 it("PHASE2-SAHR-04 create, update, grant and revoke also assert a persisted platform permission before the first query inside their transaction",()=>{
  for(const n of ["createSuperAdminHrAccount","updateSuperAdminHrAccount","grantSuperAdminHrCollegeAccess","revokeSuperAdminHrCollegeAccess"]){
   const f=functions.find(x=>x.name===n)!;
   const guard=f.body.search(PERSISTED);
   expect(guard,`${n} has no persisted permission assertion`).toBeGreaterThan(-1);
   const firstQuery=f.body.search(/tx\.(?:select|insert|update|delete|execute)/);
   if(firstQuery>=0)expect(guard,`${n} queries before asserting`).toBeLessThan(firstQuery);
  }
 });

 it("PHASE2-SAHR-04b terminateSuperAdminHrSessions verifies the target is a manageable account in scope before revoking sessions",()=>{
  const f=functions.find(x=>x.name==="terminateSuperAdminHrSessions")!;
  const get=f.body.search(/getSuperAdminHrAccount\(/);
  const manage=f.body.search(/hrAccountManageability\(/);
  const revoke=f.body.search(/revokeAllSessionsForUser\(/);
  expect(get).toBeGreaterThan(-1);
  expect(manage).toBeGreaterThan(get);
  expect(revoke).toBeGreaterThan(manage);
  expect(/PLACEMENT_RECRUITER_OUTSIDE_ADMIN_SCOPE/.test(f.body)).toBe(true);
 });

 it("PHASE2-SAHR-05 revoke and terminate record an audit event and never throw away the actor",()=>{
  for(const n of ["revokeSuperAdminHrCollegeAccess","terminateSuperAdminHrSessions"]){
   const f=functions.find(x=>x.name===n)!;
   expect(/audit|logEvent|activity|recordEvent|writeStructuredLog|insert\(/i.test(f.body),`${n} leaves no audit trail`).toBe(true);
   expect(/context\.(?:actor|user|userId|principal)|actorUserId|context\.user/.test(f.body),`${n} does not record the actor`).toBe(true);
  }
 });

 it("PHASE2-SAHR-06 the service never trusts a college or company id from the caller without matching it to the HR account",()=>{
  expect(/assertSuperAdminHrCompanyMatch/.test(src)).toBe(true);
  const grant=functions.find(f=>f.name==="grantSuperAdminHrCollegeAccess")!;
  expect(/assertSuperAdminHrCompanyMatch\(/.test(grant.body)).toBe(true);
 });
});
