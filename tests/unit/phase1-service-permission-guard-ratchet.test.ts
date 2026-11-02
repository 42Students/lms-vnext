import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";

/**
 * Phase 1 ratchet: every exported mutating service function in the projects and placements modules
 * that receives a request context must authorise inside its own body, or delegate to a named
 * function that does (listed in DELEGATES with the delegate verified to be called with the context).
 * New mutating services cannot ship without a permission check, and stale entries fail.
 */
const MODULES=["src/modules/projects","src/modules/placements"];
const MUTATING=/^(create|update|delete|remove|set|save|add|apply|bulk|withdraw|archive|reopen|merge|import|submit|approve|reject|transition|grade|assign|revoke|record|mark|send|publish|cancel|schedule|clone|undo|promote|debar|register|start|complete|close|ship|unship|restore|undelete|reorder|decide|confirm|release|reassign|override|rollback|unpublish)/i;
const GUARD=/require[A-Z]\w*\(|\bcan\(|isSuperAdmin\(|assert[A-Z]\w*\(|authorize\w*\(|hasMembershipRole\(|ensure[A-Z]\w*Access|resolve\w*Scope\(|\bscope\w*\(|Scope\(|tenantScope|\.membership\b|collegeId/;
const CTX_PARAM=/\b(ctx|context|actor|requestContext)\s*[:,)]/;

/** Functions whose own body has no marker but which call a guarded delegate with the same context. */
const DELEGATES:Record<string,string>={
 "src/modules/placements/college-bulk-drive-service.ts#updateCollegeBulkDrives":"previewCollegeBulkDrives",
 "src/modules/placements/super-admin-bulk-drive-service.ts#updateSuperAdminBulkDrives":"previewSuperAdminBulkDrives",
 "src/modules/placements/college-drive-archive-preview-service.ts#archiveCollegeDrive":"previewCollegeDriveArchive",
 "src/modules/placements/applicant-notes-service.ts#addRecruiterApplicantNote":"appendNote",
 "src/modules/projects/mentor-google-meeting-sync-service.ts#removeCancelledMentorGoogleMeeting":"verifiedGoogleMeeting",
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

/** Finds the matching close paren starting at an open paren index. */
function closeParen(src:string,open:number):number{
 let depth=0;
 for(let i=open;i<src.length;i++){
  if(src[i]==="(")depth++;
  else if(src[i]===")"){depth--;if(depth===0)return i;}
 }
 return -1;
}
/** Body start: first "{" after the params that is not inside a generic or return-type angle bracket. */
function bodyRange(src:string,afterParams:number):[number,number]|null{
 let angle=0;
 for(let i=afterParams;i<src.length;i++){
  const c=src[i]!;
  if(c==="<")angle++;
  else if(c===">"&&src[i-1]!=="=")angle=Math.max(0,angle-1);
  else if(c==="{"&&angle===0){
   let depth=0;
   for(let j=i;j<src.length;j++){
    if(src[j]==="{")depth++;
    else if(src[j]==="}"){depth--;if(depth===0)return [i+1,j];}
   }
   return null;
  }
 }
 return null;
}

type Fn={file:string;name:string;params:string;body:string};
function mutatingFunctions():Fn[]{
 const out:Fn[]=[];
 for(const mod of MODULES)for(const f of walk(path.join(process.cwd(),mod))){
  if(!f.endsWith(".ts")||f.endsWith(".d.ts"))continue;
  const src=fs.readFileSync(f,"utf8");
  const re=/export\s+async\s+function\s+(\w+)\s*(?:<[^>(]*>)?\s*\(/g;
  let m:RegExpExecArray|null;
  while((m=re.exec(src))){
   const name=m[1]!;
   if(!MUTATING.test(name))continue;
   const open=m.index+m[0].length-1;
   const close=closeParen(src,open);
   if(close<0)continue;
   const range=bodyRange(src,close+1);
   if(!range)continue;
   out.push({file:rel(f),name,params:src.slice(open+1,close),body:src.slice(range[0],range[1])});
  }
 }
 return out;
}
const functions=mutatingFunctions();
// Helpers whose first parameter is a transaction run inside an already-authorised caller; they are not entry points.
const withContext=functions.filter(f=>CTX_PARAM.test(f.params+")")&&!/^\s*(tx|trx)\s*:/.test(f.params));

describe("PHASE1-PERM service permission-guard ratchet",()=>{
 it("PHASE1-PERM-01 discovers the mutating service surface",()=>{
  expect(functions.length).toBeGreaterThan(200);
  expect(withContext.length).toBeGreaterThan(200);
 });

 it("PHASE1-PERM-02 every context-taking mutating service authorises itself or delegates to a guarded function",()=>{
  const bare=withContext
   .filter(f=>!GUARD.test(f.body)&&!GUARD.test(f.params)&&!(`${f.file}#${f.name}` in DELEGATES))
   .map(f=>`${f.file}#${f.name}`);
  expect(bare,"mutating service with a context but no permission marker or declared delegate").toEqual([]);
 });

 it("PHASE1-PERM-03 every declared delegate exists, is called with the context, and the entry is not stale",()=>{
  for(const [key,delegate] of Object.entries(DELEGATES)){
   const fn=functions.find(f=>`${f.file}#${f.name}`===key);
   expect(fn,`${key} no longer exists`).toBeDefined();
   expect(new RegExp(`\\b${delegate}\\(\\s*(ctx|context)\\b`).test(fn!.body),`${key} does not call ${delegate}(ctx...)`).toBe(true);
   expect(GUARD.test(fn!.body),`${key} now has its own guard; remove the delegate entry`).toBe(false);
  }
 });

 it("PHASE1-PERM-04 a service that takes a caller-supplied college id passes it into a permission or scope check",()=>{
  const takesCollegeId=withContext.filter(f=>/college\s*id/i.test(f.params.replace(/([a-z])([A-Z])/g,"$1 $2")));
  expect(takesCollegeId.length).toBeGreaterThan(5);
  const unchecked=takesCollegeId.filter(f=>
   !/\b(require\w*|can|assert\w*|authorize\w*|outsideActor|loadProjectCollegeScope|\w*Scope\w*)\s*\([^;]{0,240}?collegeId/.test(f.body))
   .map(f=>`${f.file}#${f.name}`);
  expect(unchecked,"college id from the caller must be authorised against the context, not trusted").toEqual([]);
 });
});
