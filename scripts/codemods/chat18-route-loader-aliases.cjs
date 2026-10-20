#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const routes=[["src/app/(authenticated)/hr/colleges/loading.tsx","Loading recruiter colleges…","directory"],["src/app/(authenticated)/hr/notifications/loading.tsx","Loading recruiter notifications…","directory"],["src/app/(authenticated)/recruiter/calendar/loading.tsx","Loading recruiter calendar…","directory"],["src/app/(authenticated)/recruiter/colleges/loading.tsx","Loading recruiter colleges…","directory"],["src/app/(authenticated)/recruiter/company/loading.tsx","Loading company…","directory"],["src/app/(authenticated)/recruiter/drives/[jobId]/messages/loading.tsx","Loading conversation history…","directory"],["src/app/(authenticated)/recruiter/messages/loading.tsx","Loading conversations…","directory"],["src/app/(authenticated)/tracker/audit-findings/[publicId]/loading.tsx","Loading audit finding…","directory"],["src/app/(authenticated)/tracker/issues/[publicId]/loading.tsx","Loading issue details…","directory"],["src/app/(authenticated)/tracker/issues/loading.tsx","Loading tracker issues…","directory"],["src/app/(authenticated)/tracker/loading.tsx","Preparing issue report…","directory"],["src/app/(authenticated)/tracker/logs/loading.tsx","Loading tracker logs…","directory"]];
const dry=process.argv.includes("--dry-run");
for(const [file,label,shape] of routes){
 const f=path.join(root,file),source=fs.readFileSync(f,"utf8");
 const before="return <GracefulPageLoading />;";
 const after='return <GracefulPageLoading label='+JSON.stringify(label)+' shape='+JSON.stringify(shape)+' />;';
 if(source.includes(after)){process.stdout.write("UNCHANGED "+file+"\n");continue}
 if(source.split(before).length!==2)throw Error("Unexpected source at "+file);
 if(!dry)fs.writeFileSync(f,source.replace(before,after));
 process.stdout.write((dry?"WOULD UPDATE ":"UPDATED ")+file+"\n");
}
