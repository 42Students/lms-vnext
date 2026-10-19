#!/usr/bin/env node
"use strict";
/** [chat-18] Responsive HR secondary search bars.
 * Legacy ref docs/design/old-lms-pages.md:8-10: search and outlined action;
 * old-lms-shell.css mobile 767px; exact shared button appearance is chat-17.
 * Command: node scripts/codemods/chat18-responsive-search.cjs --dry-run
 * Apply: node scripts/codemods/chat18-responsive-search.cjs
 * Transform has explicit source guards and is idempotent.
 */
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const files=[
  "src/app/(authenticated)/hr/activity/page.tsx",
  "src/app/(authenticated)/hr/notifications/page.tsx",
  "src/app/(authenticated)/hr/company/page.tsx"
];
const dry=process.argv.includes("--dry-run");
let changed=0;
for(const file of files){
 const p=path.join(root,file);let source=fs.readFileSync(p,"utf8");
 if(source.includes("basis-full sm:min-w-48"))continue;
 const input='className="min-w-48 flex-1"';
 if(source.split(input).length!==2)throw Error(file+": expected exactly one input");
 source=source.replace(input,'className="min-w-0 w-full basis-full sm:min-w-48 sm:basis-auto sm:flex-1"');
 const form=/className="((?:mt-3 )?)flex flex-wrap gap-2"/;
 if(!form.test(source))throw Error(file+": form shape changed");
 source=source.replace(form,(_,prefix)=>'className="'+prefix+'flex min-w-0 flex-wrap items-end gap-2"');
 const button=/<Button([^>]+)>Search<\/Button>/g;
 if([...source.matchAll(button)].length!==1)throw Error(file+": expected exactly one Search button");
 source=source.replace(button,(_,props)=>'<Button'+props+' className="min-h-11 sm:min-h-9">Search</Button>');
 if(!dry)fs.writeFileSync(p,source);
 process.stdout.write((dry?"WOULD EDIT ":"EDITED ")+file+"\n");changed++;
}
process.stdout.write("Responsive search surfaces: "+changed+"\n");
