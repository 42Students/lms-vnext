#!/usr/bin/env node
"use strict";
/**
 * chat-18 deterministic Work-queue source audit.
 * It does not render the app and is NOT pixel/legacy computed-style proof.
 * Run manually in the repo only when the owner permits:
 * node scripts/codemods/chat18-source-audit.cjs
 */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const queue=fs.readFileSync(path.join(root,"docs/audit/ux/clone-hr-secondary.md"),"utf8");
const files=[...new Set([...queue.matchAll(/^- \[[ x]\] `(src\/[^\`]+\.tsx)`/gm)].map(x=>x[1]))];
if(files.length<80)throw new Error("Expected the full HR-secondary queue, got "+files.length);
let visibleRaw=0,hidden=0,headings=0,hardHex=0,handTabs=0;
const issues=[];
for(const file of files){
 const src=fs.readFileSync(path.join(root,file),"utf8");
 const hex=[...src.matchAll(/#[0-9a-fA-F]{6}\b/g)];
 const h1=[...src.matchAll(/<h1\b/g)];
 const tabs=[...src.matchAll(/border-b-2\b/g)];
 const controls=[...src.matchAll(/<(?:button|input|select|textarea|table)\b[\s\S]*?(?:\/>|>)/g)].map(x=>x[0]);
 const rawVisible=controls.filter(x=>!/^<input\b/.test(x)||!\btype=["']hidden["']/.test(x));
 hidden+=controls.length-rawVisible.length;
 visibleRaw+=rawVisible.length;headings+=h1.length;hardHex+=hex.length;handTabs+=tabs.length;
 if(rawVisible.length||h1.length||hex.length||tabs.length)
  issues.push({file,rawVisible:rawVisible.length,h1:h1.length,hex:hex.length,handTabs:tabs.length});
}
const result={files:files.length,visibleRaw,hidden,headings,hardHex,handTabs,issues};
process.stdout.write(JSON.stringify(result,null,2)+"\n");
if(issues.length)process.exitCode=1;
