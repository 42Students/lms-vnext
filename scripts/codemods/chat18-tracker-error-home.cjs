#!/usr/bin/env node
"use strict";
/** [chat-18] In-module tracker fallback paths, idempotent and source guarded.
 * Keep shared GracefulErrorBoundary so error reporting, stale chunk refresh,
 * request reference, retry and root shell remain unchanged.
 */
const fs=require("node:fs"),path=require("node:path"),root=path.resolve(__dirname,"../..");
const routes=[["src/app/(authenticated)/tracker/audit-findings/[publicId]/error.tsx","/tracker/audit-findings"],["src/app/(authenticated)/tracker/audit-findings/error.tsx","/tracker"],["src/app/(authenticated)/tracker/issues/[publicId]/error.tsx","/tracker/issues"],["src/app/(authenticated)/tracker/issues/error.tsx","/tracker"],["src/app/(authenticated)/tracker/logs/error.tsx","/tracker/issues"],["src/app/(authenticated)/tracker/mine/[publicId]/error.tsx","/tracker/mine"]];
const dry=process.argv.includes("--dry-run");
for(const [filename,target] of routes){
 const abs=path.join(root,filename),content=fs.readFileSync(abs,"utf8");
 const before="insideShell />;",after='insideShell homeHref='+JSON.stringify(target)+' />;';
 if(content.includes(after))continue;
 if(content.split(before).length!==2)throw Error(filename+" no unique wrapper");
 if(!dry)fs.writeFileSync(abs,content.replace(before,after));
 process.stdout.write((dry?"WOULD UPDATE ":"UPDATED ")+filename+"\n");
}
