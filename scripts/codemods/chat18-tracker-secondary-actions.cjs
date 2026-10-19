#!/usr/bin/env node
"use strict";
/** [chat-18] Tracker bulk/saved-view/log/Telegram action sizes; original LMS at
 * max-width 767px: control touch target 44px (old-lms-shell.css:73-85).
 * Desktop retains compact 36px controls. No app execution.
 */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const specs=[{"path":"src/components/tracker/tracker-issue-bulk-actions.tsx","changes":[["<Button variant=\"secondary\" type=\"button\" disabled={busy} onClick={()=>{setSelecting(v=>!v);setSelected([]);setFailed([]);setNotice(\"\");}}","<Button variant=\"secondary\" type=\"button\" disabled={busy} className=\"min-h-11 md:min-h-9\" onClick={()=>{setSelecting(v=>!v);setSelected([]);setFailed([]);setNotice(\"\");}}"],["className=\"underline text-primary-text\"","className=\"min-h-11 underline text-primary-text md:min-h-9\""],["className=\"grid gap-2 sm:grid-cols-2\"","className=\"grid gap-2 md:grid-cols-2\""],["className=\"flex min-h-9 items-center gap-2 text-sm\"","className=\"flex min-h-11 items-center gap-2 text-sm md:min-h-9\""],["loading={busy} onClick={()=>void apply()}","loading={busy} className=\"min-h-11 md:min-h-9\" onClick={()=>void apply()}"]]},{"path":"src/components/tracker/tracker-issue-saved-views.tsx","changes":[["maxLength={60} placeholder=\"Name these filters\"","maxLength={60} className=\"min-h-11\" placeholder=\"Name these filters\""],["<Button variant=\"secondary\" type=\"button\" onClick={save}","<Button variant=\"secondary\" type=\"button\" className=\"min-h-11 md:min-h-9\" onClick={save}"],["<Button variant=\"ghost\" type=\"button\" onClick={()=>router.push(","<Button variant=\"ghost\" type=\"button\" className=\"min-h-11 md:min-h-9\" onClick={()=>router.push("],["className=\"border-l border-border\"","className=\"min-h-11 border-l border-border md:min-h-9\""]]},{"path":"src/components/tracker/tracker-issue-logs-panel.tsx","changes":[["<Button variant=\"secondary\" type=\"button\" disabled={busy} onClick={()=>void load()}","<Button variant=\"secondary\" type=\"button\" disabled={busy} className=\"min-h-11 md:min-h-9\" onClick={()=>void load()"],["className=\"mt-2 inline-flex min-h-9 items-center font-semibold","className=\"mt-2 inline-flex min-h-11 items-center font-semibold md:min-h-9"]]},{"path":"src/components/tracker/tracker-telegram-manual-panel.tsx","changes":[["className=\"grid gap-2 text-sm sm:grid-cols-2\"","className=\"grid gap-2 text-sm md:grid-cols-2\""],["<Button variant=\"secondary\" type=\"button\" disabled={pending} onClick={()=>setOpen(true)}","<Button variant=\"secondary\" type=\"button\" disabled={pending} className=\"min-h-11 md:min-h-9\" onClick={()=>setOpen(true)"],["<Button variant=\"secondary\" type=\"button\" disabled={!configured||pending} onClick={()=>setConfirm(\"TEST\")}","<Button variant=\"secondary\" type=\"button\" disabled={!configured||pending} className=\"min-h-11 md:min-h-9\" onClick={()=>setConfirm(\"TEST\")"],["<Button variant=\"secondary\" type=\"button\" disabled={!configured||pending} onClick={()=>setConfirm(\"DIGEST\")}","<Button variant=\"secondary\" type=\"button\" disabled={!configured||pending} className=\"min-h-11 md:min-h-9\" onClick={()=>setConfirm(\"DIGEST\")"],["<Button variant=\"secondary\" type=\"button\" onClick={()=>setOpen(false)}","<Button variant=\"secondary\" type=\"button\" className=\"min-h-11 md:min-h-9\" onClick={()=>setOpen(false)"]]}];
const dry=process.argv.includes("--dry-run");
for(const s of specs){
 const p=path.join(root,s.path);let c=fs.readFileSync(p,"utf8"),changed=0;
 for(const [a,b] of s.changes){
  if(c.includes(b))continue;
  const count=c.split(a).length-1,expected=a==='className="underline text-primary-text"'?2:1;
  if(count!==expected)throw Error(s.path+" expected "+expected+" "+a);
  c=c.replaceAll(a,b);changed+=count;
 }
 if(changed&&!dry)fs.writeFileSync(p,c);
 process.stdout.write(s.path+" "+changed+"\n");
}
