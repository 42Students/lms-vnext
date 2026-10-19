#!/usr/bin/env node
"use strict";
/** [chat-18] Tracker controls inherit 44px touch height through 767px.
 * Legacy references: old-lms-shell.css:73-85 and components___listing-page-header.scss:131-164.
 * Run with --dry-run to inspect, idempotent and scoped to the four entries below.
 */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const entries=[{"path":"src/components/tracker/tracker-admin-nav.tsx","changes":[["focus:min-h-9 focus:items-center","focus:min-h-11 md:focus:min-h-9 focus:items-center"]]},{"path":"src/components/tracker/tracker-theme-toggle.tsx","changes":[["className=\"min-h-[var(--lms-control-height)] px-4\"","className=\"min-h-11 px-4 md:min-h-[var(--lms-control-height)]\""]]},{"path":"src/components/tracker/independent-finding-actions.tsx","changes":[["<Button variant=\"primary\" type=\"button\" onClick={()=>void submit()} disabled={pending}\n   >","<Button variant=\"primary\" type=\"button\" onClick={()=>void submit()} disabled={pending} className=\"min-h-11 md:min-h-9\">"]]},{"path":"src/components/tracker/tracker-workflow-panel.tsx","changes":[["className=\"mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline\"","className=\"mt-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9\""],["className=\"flex min-h-9 items-center gap-3 text-sm font-semibold text-body\"","className=\"flex min-h-11 items-center gap-3 text-sm font-semibold text-body md:min-h-9\""],["<Button disabled={pending} loading={pending} onClick={save}>","<Button disabled={pending} loading={pending} onClick={save} className=\"min-h-11 md:min-h-9\">"],["<Button disabled={pending} loading={pending} onClick={() => retest(\"PASS\")}>","<Button disabled={pending} loading={pending} onClick={() => retest(\"PASS\")} className=\"min-h-11 md:min-h-9\">"],["<Button variant=\"danger\" disabled={pending} loading={pending} onClick={() => retest(\"FAIL\")}>","<Button variant=\"danger\" disabled={pending} loading={pending} onClick={() => retest(\"FAIL\")} className=\"min-h-11 md:min-h-9\">"]]}];
const dry=process.argv.includes("--dry-run");
for(const item of entries){
 const f=path.join(root,item.path);let source=fs.readFileSync(f,"utf8"),edits=0;
 for(const [oldText,newText] of item.changes){
  if(source.includes(newText))continue;
  const count=source.split(oldText).length-1;
  const wanted=item.path.includes("tracker-workflow-panel")&&oldText.startsWith('className="mt-2 inline-flex')?2:1;
  if(count!==wanted)throw Error(item.path+": expected "+wanted+" instances, found "+count);
  source=source.replaceAll(oldText,newText);edits+=count;
 }
 if(edits&&!dry)fs.writeFileSync(f,source);
 process.stdout.write(item.path+" "+edits+"\n");
}
