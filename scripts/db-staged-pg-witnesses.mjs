#!/usr/bin/env node
// DB-phase opt-in PostgreSQL witnesses. Staged-only: NOT registered-schema replay.
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {assertSafeDb01TestTarget} from "./db01-test-database-guard.mjs";
export const CONSENT="I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA";
export const WITNESSES=Object.freeze([
 ["tests/db01-auth-attempt-lifecycle-pg.test.mjs","DB01_AUTH_DISPOSABLE"],
 ["tests/db01-auth-handoff-lifecycle-pg.test.mjs","DB01_HANDOFF_DISPOSABLE"],
 ["tests/db01-college-membership-domain-archive-pg.test.mjs","DB01_RACE_DISPOSABLE"],
 ["tests/db01-domain-tombstone-state-pg.test.mjs","DB01_DOMAIN_DISPOSABLE"],
 ["tests/db04-profile-education-images-pg.test.mjs","DB04_PROFILE_DISPOSABLE"],
]);
const isLocal=h=>["localhost","127.0.0.1","[::1]","::1"].includes(h.toLowerCase());
const endpoint=u=>(isLocal(u.hostname)?"LOCAL_LOOPBACK":u.hostname.toLowerCase())+":"+(u.port||"5432")+"/"+decodeURIComponent(u.pathname.slice(1)).toLowerCase();
export function validateTarget(env, optIn=true){
 const errors=[];
 if(!env.TEST_DATABASE_URL)return {safe:false,errors:["TEST_DATABASE_URL required"]};
 let u;try{u=new URL(env.TEST_DATABASE_URL)}catch{return {safe:false,errors:["Invalid TEST_DATABASE_URL"]}};
 if(!["postgres:","postgresql:"].includes(u.protocol))errors.push("PostgreSQL URL only");
 if(!u.username||!u.hostname||u.pathname==="/")errors.push("Database, host, user required");
 if(u.search||u.hash)errors.push("URL parameters/fragment forbidden");
 let db="";try{db=decodeURIComponent(u.pathname.slice(1))}catch{errors.push("Invalid database name")};
 if(!/(^|[_-])(test|disposable|scratch)([_-]|$)/i.test(db)||["postgres","template0","template1"].includes(db.toLowerCase()))errors.push("Disposable/test database name required");
 if(env.DATABASE_URL){try{if(endpoint(new URL(env.DATABASE_URL))===endpoint(u))errors.push("Same target as application DATABASE_URL")}catch{errors.push("Malformed application DATABASE_URL")}}
 if(!isLocal(u.hostname)){
   if(env.ALLOW_REMOTE_TEST_WITNESS!=="true")errors.push("Explicit remote witness opt-in required");
   if(env.DB_WITNESS_REMOTE_CONFIRM!=="DISPOSABLE:"+u.hostname.toLowerCase()+":"+(u.port||"5432")+"/"+db)errors.push("Exact remote target confirmation required");
 }
 if(optIn&&env.DB_STAGED_WITNESSES!==CONSENT)errors.push("DB_STAGED_WITNESSES opt-in missing");
 // The shared disposable-target policy is stricter than the witness-specific
 // opt-ins: it rejects path-encoded aliases, special database names and
 // connection-string overrides before any test subprocess can connect.
 // Translate an already-verified witness remote confirmation into the
 // canonical guard's format; never bypass either of the remote opt-ins.
 if(!errors.length){
   const remoteConfirmation="DISPOSABLE:"+u.hostname.toLowerCase()+":"+(u.port||"5432")+"/"+db;
   const canonicalEnv={
     TEST_DATABASE_URL:env.TEST_DATABASE_URL,
     DATABASE_URL:env.DATABASE_URL,
     DB01_REMOTE_TEST_DATABASE_CONFIRM:
       !isLocal(u.hostname)&&env.ALLOW_REMOTE_TEST_WITNESS==="true"&&
       env.DB_WITNESS_REMOTE_CONFIRM===remoteConfirmation
         ? "RESET:"+u.hostname.toLowerCase()+(u.port && u.port!=="5432" ? ":"+u.port : "")+"/"+db : undefined,
   };
   try{assertSafeDb01TestTarget(canonicalEnv)}
   catch(error){errors.push("Canonical disposable target refused: "+error.message)}
 }
 return {safe:!errors.length,errors,target:{host:u.hostname,database:db,port:u.port||"5432"}};
}
export function parseTap(output) {
 const pairs=[...String(output).matchAll(/^# (tests|pass|fail|skipped|cancelled) (\d+)\s*$/gm)].map(m=>[m[1],Number(m[2])]);
 const x=Object.fromEntries(pairs);
 return {tests:x.tests??null,pass:x.pass??null,fail:x.fail??null,skipped:x.skipped??null,cancelled:x.cancelled??null};
}
export function assertPass(code,output){
 const x=parseTap(output);
 if(code!==0||!x.tests||x.pass!==x.tests||x.fail!==0||x.skipped!==0||x.cancelled!==0)throw Error("Witness failed, skipped, or missing full TAP result: "+JSON.stringify({exitCode:code,...x}));
 return x;
}
export function runWitnesses(env=process.env,run=spawnSync){
 const gate=validateTarget(env);if(!gate.safe)throw Error("Unsafe target: "+gate.errors.join("; "));
 const clean={...env};for(const k of ["DATABASE_URL","ALLOW_DB_RESET","DB_RESET_CONFIRM","DB_SEED_CONFIRM","ALLOW_DB_SEED",...WITNESSES.map(x=>x[1])])delete clean[k];
 const results=[];
 for(const [file,flag]of WITNESSES){
  const p=run(process.execPath,["--test",file],{cwd:resolve(fileURLToPath(new URL("..",import.meta.url))),env:{...clean,[flag]:CONSENT},encoding:"utf8",timeout:125000,maxBuffer:4*1024*1024});
  if(p.error)throw Error(file+": "+p.error.message);
  let summary;try{summary=assertPass(p.status,(p.stdout||"")+"\n"+(p.stderr||""))}catch(e){throw Error(file+": "+e.message)}
  results.push({file,summary});
 }
 return {verification:"STAGED_DISPOSABLE_POSTGRES_ONLY_NOT_MIGRATION_REPLAY",target:gate.target,results};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.includes("--plan"))console.log(JSON.stringify({mode:"NO_DB_CONNECT",suites:WITNESSES},null,2));
 else if(process.argv.includes("--run")){try{console.log(JSON.stringify(runWitnesses(),null,2))}catch(e){console.error(e.message);process.exitCode=1}}
 else{console.error("Use --plan or --run with TEST_DATABASE_URL and DB_STAGED_WITNESSES consent");process.exitCode=2}
}
