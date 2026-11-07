import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";

/**
 * Phase 1 ratchet: every API route of the Projects and Placements modules must either authenticate
 * (an auth/context/secret marker in its own file), be a pure alias that delegates to another route
 * file that does, or be listed in EXCEPTIONS with a written reason. A new unauthenticated route
 * cannot ship, and a stale exception fails so the list only shrinks.
 */
const API_ROOT=path.join(process.cwd(),"src","app","api");
const ROUTE_FILE=/\/route\.ts$/;
const SCOPE=/(project|placement)/i;

const AUTH_MARKER=new RegExp([
 "getCurrentRequestContext","@/security/route","@/security/internal-route","requireAuth","getRequestContext","requireRequestContext","requireSession",
 "authorize[A-Z]\\w*\\(","require[A-Z]\\w*Context","require[A-Z]\\w*Access","resolve\\w*Context",
 "with\\w*Auth","verifyInternal","timingSafeEqual","assertInternal","schedulerKey","x-recruiter-mail-signature",
].join("|"));

const ALIAS_IMPORT=/from\s*["']((?:\.\.\/)+[^"']*route|@\/app\/api\/[^"']+\/route)["']/;

const EXCEPTIONS:Record<string,string>={
 "src/app/api/placements/company-share/[token]/export/route.ts":
  "Public company share: authorised by an unguessable share token plus the company_share_access proof cookie checked in getPublicCompanyApplicantShare.",
 "src/app/api/public/placement-job/[slug]/route.ts":
  "Public read of an intentionally published external job share, GET only, no-store, errors collapse to NOT_FOUND.",
 "src/app/api/v1/public/placements-page/recruit/route.ts":
  "Legacy alias of the public recruiter enquiry POST; the canonical handler checks same-origin and resolves the college from the verified host.",
 "src/app/api/v1/public/placements-page/send-code/route.ts":
  "Legacy alias of the public enquiry code POST; the canonical handler checks same-origin and resolves the college from the verified host.",
 "src/app/api/v1/public/placements-page/route.ts":
  "Public college placements page; the college is resolved from the verified host and only published content is read.",
};

function walk(dir:string,out:string[]=[]):string[]{
 for(const name of fs.readdirSync(dir)){
  const full=path.join(dir,name);
  if(fs.statSync(full).isDirectory())walk(full,out);
  else out.push(full);
 }
 return out;
}
const rel=(f:string)=>path.relative(process.cwd(),f).split(path.sep).join("/");
const routes=walk(API_ROOT).filter(f=>ROUTE_FILE.test(f.split(path.sep).join("/"))&&SCOPE.test(rel(f)));
const read=(f:string)=>fs.readFileSync(f,"utf8");

function resolveAlias(file:string,src:string):string|null{
 const m=ALIAS_IMPORT.exec(src);
 if(!m)return null;
 const spec=m[1]!;
 const target=spec.startsWith("@/")
  ? path.join(process.cwd(),"src",spec.slice(2)+".ts")
  : path.resolve(path.dirname(file),spec+".ts");
 return target;
}
function isGuarded(file:string,src:string,seen=new Set<string>()):boolean{
 if(AUTH_MARKER.test(src))return true;
 if(seen.has(file))return false;
 seen.add(file);
 const target=resolveAlias(file,src);
 if(target&&fs.existsSync(target))return isGuarded(target,read(target),seen);
 return false;
}

describe("PHASE1-AUTH route authentication ratchet",()=>{
 it("PHASE1-AUTH-01 discovers the project and placement route surface",()=>{
  expect(routes.length).toBeGreaterThan(400);
 });

 it("PHASE1-AUTH-02 every route authenticates, delegates to a route that does, or is a documented exception",()=>{
  const unguarded=routes.filter(f=>!isGuarded(f,read(f))&&!(rel(f) in EXCEPTIONS)).map(rel);
  expect(unguarded,"routes with no auth marker, alias target or documented exception").toEqual([]);
 });

 it("PHASE1-AUTH-03 every documented exception exists, still lacks an auth marker of its own, and has a real reason",()=>{
  for(const [file,reason] of Object.entries(EXCEPTIONS)){
   const abs=path.join(process.cwd(),file);
   expect(fs.existsSync(abs),`${file} no longer exists; remove the exception`).toBe(true);
   expect(reason.length,file).toBeGreaterThan(40);
   expect(AUTH_MARKER.test(read(abs)),`${file} now has its own auth marker; remove the exception`).toBe(false);
  }
 });

 it("PHASE1-AUTH-04 exceptions never cover a mutating handler",()=>{
  for(const file of Object.keys(EXCEPTIONS)){
   const src=read(path.join(process.cwd(),file));
   expect(/export\s+(?:async\s+function|const)\s+(?:POST|PUT|PATCH|DELETE)\b/.test(src),file).toBe(false);
  }
 });

 it("PHASE1-AUTH-05 every alias route resolves to a target route file that exists",()=>{
  for(const f of routes){
   const src=read(f);
   if(AUTH_MARKER.test(src))continue;
   const target=resolveAlias(f,src);
   if(target)expect(fs.existsSync(target),`${rel(f)} aliases a missing route ${target}`).toBe(true);
  }
 });

 it("PHASE1-AUTH-06 internal scheduler and worker routes authenticate with a timing-safe secret or a signature",()=>{
  const internal=routes.filter(f=>rel(f).includes("/api/internal/"));
  expect(internal.length).toBeGreaterThan(3);
  for(const f of internal){
   const src=read(f);
   expect(/internalRoute\(|timingSafeEqual|x-recruiter-mail-signature|verifyInternal|assertInternal|schedulerKey/.test(src)||isGuarded(f,src),rel(f)).toBe(true);
   expect(/getCurrentRequestContext/.test(src)&&!/timingSafeEqual|signature/i.test(src),
    `${rel(f)} relies on a browser session but lives under /internal`).toBe(false);
  }
 });
});
