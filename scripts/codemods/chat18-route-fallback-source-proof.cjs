#!/usr/bin/env node
"use strict";
/** chat-18 route-specific source proof; no app/CI execution required.
 * Only the route's own markup is covered; shared skeleton/retained legacy
 * paint requires the shared owner's computed-styles and visual signoff.
 * Usage: node scripts/codemods/chat18-route-fallback-source-proof.cjs
 */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const loaders=[["src/app/(authenticated)/hr/activity/loading.tsx","Loading hiring activity…","directory"],["src/app/(authenticated)/hr/company/reports/loading.tsx","Loading company reports…","card"],["src/app/(authenticated)/hr/conversations/loading.tsx","Loading recruiter messages…","directory"],["src/app/(authenticated)/hr/colleges/loading.tsx","Loading recruiter colleges…","directory"],["src/app/(authenticated)/hr/notifications/loading.tsx","Loading recruiter notifications…","directory"],["src/app/(authenticated)/recruiter/calendar/loading.tsx","Loading recruiter calendar…","directory"],["src/app/(authenticated)/recruiter/colleges/loading.tsx","Loading recruiter colleges…","directory"],["src/app/(authenticated)/recruiter/company/loading.tsx","Loading company…","directory"],["src/app/(authenticated)/recruiter/drives/[jobId]/messages/loading.tsx","Loading conversation history…","directory"],["src/app/(authenticated)/recruiter/messages/loading.tsx","Loading conversations…","directory"],["src/app/(authenticated)/tracker/audit-findings/[publicId]/loading.tsx","Loading audit finding…","directory"],["src/app/(authenticated)/tracker/issues/[publicId]/loading.tsx","Loading issue details…","directory"],["src/app/(authenticated)/tracker/issues/loading.tsx","Loading tracker issues…","directory"],["src/app/(authenticated)/tracker/loading.tsx","Preparing issue report…","directory"],["src/app/(authenticated)/tracker/logs/loading.tsx","Loading tracker logs…","directory"]];
const errors=[["src/app/(authenticated)/tracker/audit-findings/[publicId]/error.tsx","/tracker/audit-findings"],["src/app/(authenticated)/tracker/audit-findings/error.tsx","/tracker"],["src/app/(authenticated)/tracker/issues/[publicId]/error.tsx","/tracker/issues"],["src/app/(authenticated)/tracker/issues/error.tsx","/tracker"],["src/app/(authenticated)/tracker/logs/error.tsx","/tracker/issues"],["src/app/(authenticated)/tracker/mine/[publicId]/error.tsx","/tracker/mine"]];
let totals={loaders:0,errors:0,rawControls:0,hex:0,h1:0,ownOverlays:0,customTabs:0};
function inspect(file){
 const source=fs.readFileSync(path.join(root,file),"utf8");
 for(const [key,pattern] of [
  ["rawControls",/<(?:button|input|select|textarea|table)\b/g],
  ["hex",/#[0-9a-fA-F]{6}\b/g],
  ["h1",/<h1\b/g],
  ["ownOverlays",/fixed\s+inset-0|role=["'](?:dialog|alertdialog)["']/g],
  ["customTabs",/border-b-2\b/g]]){
  const n=(source.match(pattern)||[]).length;totals[key]+=n;
  if(n)throw Error(file+" has "+n+" own "+key);
 }
 return source;
}
for(const [file,label,shape] of loaders){
 const source=inspect(file);
 const token='<GracefulPageLoading label='+JSON.stringify(label)+' shape='+JSON.stringify(shape)+' />';
 if(!source.includes(token))throw Error(file+" incorrect loading contract");
 if((source.match(/<GracefulPageLoading\b/g)||[]).length!==1)throw Error(file+" repeated loader");
 if(/className=|<div\b|<section\b|<Skeleton\b|<Card\b/.test(source))throw Error(file+" duplicated local paint");
 totals.loaders++;
}
for(const [file,home] of errors){
 const source=inspect(file);
 const homeProp='homeHref='+JSON.stringify(home);
 if(!source.includes("insideShell "+homeProp))throw Error(file+" lost module-relative home action");
 if((source.match(/<GracefulErrorBoundary\b/g)||[]).length!==1)throw Error(file+" repeated error boundary");
 if(/className=|<div\b|<section\b|<Card\b/.test(source))throw Error(file+" authored duplicate canvas");
 totals.errors++;
}
if(totals.loaders!==15||totals.errors!==6)throw Error("Incorrect queue scope");
process.stdout.write(JSON.stringify(totals,null,2)+"\n");
