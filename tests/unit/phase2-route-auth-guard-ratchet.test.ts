import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";

/**
 * Phase 2 ratchet: API routes in the TPO, HR and recruiter scope whose path is NOT already covered by the
 * Phase 1 project/placement ratchets (admin/hr, auth/recruiter, public/recruit*, tpo/*, v1/tpo/*) must
 * authenticate, delegate to a route that does, or be listed in EXCEPTIONS with a written reason.
 */
const API_ROOT=path.join(process.cwd(),"src","app","api");
const SCOPE=/(tpo|\/hr|recruit)/i;
const PHASE1=/(project|placement)/i;

const AUTH_MARKER=new RegExp([
 "getCurrentRequestContext","@/security/route","requireAuth","getRequestContext","requireRequestContext","requireSession",
 "authorize[A-Z]\\w*\\(","require[A-Z]\\w*Context","require[A-Z]\\w*Access","resolve\\w*Context",
 "with\\w*Auth","verifyInternal","timingSafeEqual","assertInternal","schedulerKey","guardLoginRequest",
].join("|"));
// A route() declared auth: "public" is NOT authenticated by the central wrapper: its import alone must not satisfy the marker.
const hasAuthMarker=(src:string)=>AUTH_MARKER.test(src.includes('auth: "public"')?src.split("@/security/route").join(""):src);
const ALIAS_IMPORT=/from\s*["']((?:\.\.\/)+[^"']*route|@\/app\/api\/[^"']+\/route)["']/;

/** Public routes: authorised by an unguessable invite token or by being a public enquiry form. All are same-origin guarded. */
const EXCEPTIONS:Record<string,string>={
 "src/app/api/public/recruit-from-us/recruit/route.ts":
  "Public recruiter enquiry form: the college is resolved from the verified host, same-origin is checked and the service rate-limits by email code.",
 "src/app/api/public/recruit-from-us/send-code/route.ts":
  "Public enquiry code request: same-origin checked, college resolved from the verified host, delivery is rate-limited in the send service.",
 "src/app/api/public/recruiter-invite/[token]/route.ts":
  "Public preview of one invitation, authorised by the unguessable invite token; GET only and previewRecruiterInvite collapses bad tokens.",
 "src/app/api/public/recruiter-invite/[token]/accept/route.ts":
  "Invite acceptance: authorised by the invite token plus a one-time emailed code verified in acceptPublicTpoRecruiterInviteOtp; same-origin checked.",
 "src/app/api/public/recruiter-invite/[token]/not-hiring/route.ts":
  "A public bearer token only permits declining this one invitation with a bounded note; same-origin checked.",
 "src/app/api/public/recruiter-invite/[token]/opened/route.ts":
  "Records the first open of one invitation by its token; idempotent, same-origin checked, returns no invitee data beyond the token holder's own.",
 "src/app/api/public/recruiter-invite/[token]/send-code/route.ts":
  "Requests the one-time code for one invitation: token shape is validated first, same-origin checked, delivery rate-limited.",
 "src/app/api/public/recruiter-invite/[token]/unsubscribe/route.ts":
  "Unsubscribes one invitation by its token; idempotent and same-origin checked.",
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
const read=(f:string)=>fs.readFileSync(f,"utf8");
const routes=walk(API_ROOT).filter(f=>f.split(path.sep).join("/").endsWith("/route.ts")&&SCOPE.test(rel(f))&&!PHASE1.test(rel(f)));

function resolveAlias(file:string,src:string):string|null{
 const m=ALIAS_IMPORT.exec(src);
 if(!m)return null;
 const spec=m[1]!;
 return spec.startsWith("@/")?path.join(process.cwd(),"src",spec.slice(2)+".ts"):path.resolve(path.dirname(file),spec+".ts");
}
function isGuarded(file:string,src:string,seen=new Set<string>()):boolean{
 if(hasAuthMarker(src))return true;
 if(seen.has(file))return false;
 seen.add(file);
 const target=resolveAlias(file,src);
 return Boolean(target&&fs.existsSync(target)&&isGuarded(target,read(target),seen));
}

describe("PHASE2-AUTH TPO/HR/recruiter route authentication ratchet",()=>{
 it("PHASE2-AUTH-01 discovers the Phase 2 route surface (admin/hr, auth/recruiter, public/recruit*, tpo, v1/tpo)",()=>{
  expect(routes.length).toBeGreaterThanOrEqual(28);
  const heads=new Set(routes.map(f=>rel(f).split("/")[3]));
  for(const h of ["admin","auth","public","tpo","v1"])expect(heads.has(h),h).toBe(true);
 });

 it("PHASE2-AUTH-02 every route authenticates, delegates to a route that does, or is a documented exception",()=>{
  const unguarded=routes.filter(f=>!isGuarded(f,read(f))&&!(rel(f) in EXCEPTIONS)).map(rel);
  expect(unguarded).toEqual([]);
 });

 it("PHASE2-AUTH-03 every documented exception exists, still lacks its own auth marker, and has a real reason",()=>{
  for(const [file,reason] of Object.entries(EXCEPTIONS)){
   const abs=path.join(process.cwd(),file);
   expect(fs.existsSync(abs),`${file} no longer exists; remove the exception`).toBe(true);
   expect(reason.length,file).toBeGreaterThan(40);
   expect(hasAuthMarker(read(abs)),`${file} now has its own auth marker; remove the exception`).toBe(false);
  }
 });

 it("PHASE2-AUTH-04 every mutating exception checks same-origin and every exception is public (never under admin or tpo)",()=>{
  for(const file of Object.keys(EXCEPTIONS)){
   const src=read(path.join(process.cwd(),file));
   expect(file.startsWith("src/app/api/public/"),file).toBe(true);
   if(/export\s+(?:async\s+function|const)\s+(?:POST|PUT|PATCH|DELETE)\b/.test(src))
    expect(/isSameOriginRequest\(/.test(src),`${file} mutates without a same-origin check`).toBe(true);
  }
 });

 it("PHASE2-AUTH-05 every admin/hr route resolves the request context so the service can enforce super-admin permission",()=>{
  const hr=routes.filter(f=>rel(f).startsWith("src/app/api/admin/hr/"));
  expect(hr.length).toBe(7);
  for(const f of hr)expect(/getCurrentRequestContext\(|from "@\/security\/route"/.test(read(f)),rel(f)).toBe(true);
 });

 it("PHASE2-AUTH-06 recruiter email login start uses the shared login guard, not a hand-rolled check",()=>{
  const src=read(path.join(process.cwd(),"src/app/api/auth/recruiter/email-login/start/route.ts"));
  expect(/guardLoginRequest\(request,schema,"recruiter-email-login-start"/.test(src)).toBe(true);
  expect(/z\.strictObject/.test(src)).toBe(true);
 });

 it("PHASE2-AUTH-07 every tpo and v1/tpo route authenticates with the request context (no public tpo route)",()=>{
  const tpo=routes.filter(f=>/^src\/app\/api\/(v1\/)?tpo\//.test(rel(f)));
  expect(tpo.length).toBeGreaterThanOrEqual(12);
  for(const f of tpo)expect(isGuarded(f,read(f)),rel(f)).toBe(true);
 });
});
