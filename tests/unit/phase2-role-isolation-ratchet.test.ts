import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";

/**
 * Phase 2 ratchet on cross-role isolation: TPO-only data (private student notes, internal team threads and asks,
 * recruiter leads, diversity outreach policy, TPO message drafts) must never be imported by HR, recruiter or
 * learner code. Role separation is enforced by permission checks, but a stray import is the usual way private
 * TPO data ends up on a recruiter or learner screen, so the import graph is pinned.
 */
const PRIVATE_TPO=/modules\/placements\/tpo-(student-notes|team-|diversity-outreach|lead-|messages|message-)/;
const SRC=path.join(process.cwd(),"src");

function walk(dir:string,out:string[]=[]):string[]{
 if(!fs.existsSync(dir))return out;
 for(const name of fs.readdirSync(dir)){
  const full=path.join(dir,name);
  if(fs.statSync(full).isDirectory())walk(full,out);
  else if(/\.(ts|tsx)$/.test(name))out.push(full);
 }
 return out;
}
const rel=(f:string)=>path.relative(process.cwd(),f).split(path.sep).join("/");

const HR_RECRUITER_ROOTS=[
 "app/(authenticated)/hr","app/(authenticated)/recruiter","app/api/hr","app/api/recruiter","app/api/v1/recruiter",
 "components/hr","components/recruiter",
];
const LEARNER_ROOTS=[
 "app/(authenticated)/learn","app/api/learner","app/api/placements/learner","app/api/v1/learner","components/learn","components/learner",
];

function importsOf(file:string){
 const text=fs.readFileSync(file,"utf8");
 return [...text.matchAll(/from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)].map(m=>m[1]??m[2]!);
}
function offenders(roots:string[]){
 const found:string[]=[];
 for(const root of roots){
  for(const f of walk(path.join(SRC,root))){
   for(const spec of importsOf(f))if(PRIVATE_TPO.test(spec))found.push(`${rel(f)} -> ${spec}`);
  }
 }
 return found;
}
const count=(roots:string[])=>roots.reduce((n,r)=>n+walk(path.join(SRC,r)).length,0);

describe("PHASE2-ISOLATE cross-role import isolation",()=>{
 it("PHASE2-ISOLATE-01 the scanned HR, recruiter and learner surfaces are non-trivial",()=>{
  expect(count(HR_RECRUITER_ROOTS)).toBeGreaterThan(150);
  expect(count(LEARNER_ROOTS)).toBeGreaterThan(100);
 },60000);

 it("PHASE2-ISOLATE-02 HR and recruiter code never imports TPO-private modules",()=>{
  expect(offenders(HR_RECRUITER_ROOTS)).toEqual([]);
 },60000);

 it("PHASE2-ISOLATE-03 learner code never imports TPO-private modules",()=>{
  expect(offenders(LEARNER_ROOTS)).toEqual([]);
 },60000);

 it("PHASE2-ISOLATE-04 the private TPO modules exist, so a rename cannot silently weaken the pattern",()=>{
  const dir=path.join(SRC,"modules","placements");
  const names=fs.readdirSync(dir);
  for(const prefix of ["tpo-student-notes","tpo-team-","tpo-diversity-outreach","tpo-lead-","tpo-messages","tpo-message-"])
   expect(names.some(n=>n.startsWith(prefix)),prefix).toBe(true);
 });

 /** Shared route that legitimately reads TPO team threads, with the guards that must stay in the file. */
 const SHARED_ROUTE_EXCEPTIONS:Record<string,{reason:string;requires:RegExp[]}>={
  "src/app/api/placements/jobs/[jobId]/change-requests/route.ts":{
   reason:"Legacy change-request compatibility view; DRIVE team threads are read only for an active placement-team member, in manage scope, for this tenant's drive, as a current thread participant.",
   requires:[
    /hasPlacementTeamMembership\(context\)/,
    /requirePlacementManageScope\(/,
    /assertPersistedPlatformPermission\(tx,context,"placements\.manage"/,
    /eq\(placementJobs\.collegeId,college\.id\)/,
    /eq\(placementTpoInternalThreadParticipants\.membershipId,context\.membership\.id\)/,
    /isNull\(placementTpoInternalThreadParticipants\.leftAt\)/,
    /never treats recruiter change-request notes as[\s*]*internal staff messages/,
   ],
  },
 };

 it("PHASE2-ISOLATE-05 no API route outside /tpo and /admin imports a private TPO module unless it is a documented, guarded exception",()=>{
  const bad:string[]=[];
  for(const f of walk(path.join(SRC,"app","api"))){
   const r=rel(f);
   if(/\/api\/(v1\/)?tpo\//.test(r)||/\/api\/admin\//.test(r)||/\/api\/placements\/tpo\//.test(r))continue;
   if(r in SHARED_ROUTE_EXCEPTIONS)continue;
   for(const spec of importsOf(f))if(PRIVATE_TPO.test(spec))bad.push(`${r} -> ${spec}`);
  }
  expect(bad).toEqual([]);
 },120000);

 it("PHASE2-ISOLATE-06 each shared-route exception still exists, still imports a private module and keeps every named guard",()=>{
  for(const [file,{reason,requires}] of Object.entries(SHARED_ROUTE_EXCEPTIONS)){
   const abs=path.join(process.cwd(),file);
   expect(fs.existsSync(abs),`${file} no longer exists; remove the exception`).toBe(true);
   expect(reason.length,file).toBeGreaterThan(60);
   const text=fs.readFileSync(abs,"utf8");
   expect(importsOf(abs).some(s=>PRIVATE_TPO.test(s)),`${file} no longer imports a private module; remove the exception`).toBe(true);
   for(const guard of requires)expect(guard.test(text),`${file} lost guard ${guard}`).toBe(true);
  }
 });
});
