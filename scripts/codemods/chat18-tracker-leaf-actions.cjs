#!/usr/bin/env node
"use strict";
/** [chat-18] Tracker scoped leaf actions, phone 44px and desktop 36px.
 * Reference: old-lms-shell.css:73-85, components___listing-page-header.scss:131-164.
 * Supports --dry-run; repeatable and idempotent. No shared UI mutations.
 */
const fs=require("node:fs"),path=require("node:path"),root=path.resolve(__dirname,"../..");
const specs=[{"path":"src/components/tracker/independent-finding-copy-action.tsx","changes":[["<Button variant=\"secondary\" type=\"button\" onClick={()=>void copy()}","<Button variant=\"secondary\" type=\"button\" className=\"min-h-11 md:min-h-9\" onClick={()=>void copy()"]]},{"path":"src/components/tracker/tracker-issue-copy-actions.tsx","changes":[["<Button variant=\"secondary\" type=\"button\" onClick={()=>void copy(","<Button variant=\"secondary\" type=\"button\" className=\"min-h-11 md:min-h-9\" onClick={()=>void copy("]]},{"path":"src/components/tracker/audit-finding-status-action.tsx","changes":[["<Select value={status} disabled={pending} onChange={e=>setStatus(e.target.value as BugStatus)}","<Select value={status} disabled={pending} className=\"min-h-11 md:min-h-9\" onChange={e=>setStatus(e.target.value as BugStatus)}"],["<Button size=\"sm\" variant=\"secondary\" disabled={!canChangeAuditFindingStatus(current,status,pending)}","<Button size=\"sm\" variant=\"secondary\" className=\"min-h-11 md:min-h-9\" disabled={!canChangeAuditFindingStatus(current,status,pending)}"]]},{"path":"src/components/tracker/tracker-quick-report-launcher.tsx","changes":[["className=\"fixed bottom-5 right-5 z-40 shadow-[var(--lms-overlay-shadow)]\"","className=\"fixed bottom-5 right-5 z-40 min-h-11 shadow-[var(--lms-overlay-shadow)] md:min-h-9\""]]}];
for(const s of specs){let p=path.join(root,s.path),c=fs.readFileSync(p,"utf8"),n=0;
 for(const [a,b] of s.changes){if(c.includes(b))continue;
  const expected=s.path.includes("tracker-issue-copy-actions")?2:1;
  if(c.split(a).length-1!==expected)throw Error(s.path+" not "+expected+" "+a);
  c=c.replaceAll(a,b);n+=expected;
 }
 if(n&&!process.argv.includes("--dry-run"))fs.writeFileSync(p,c);
 process.stdout.write(s.path+" "+n+"\n");
}
