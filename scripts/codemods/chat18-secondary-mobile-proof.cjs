#!/usr/bin/env node
"use strict";
/**
 * [chat-18] Strict source-only proof for 16 owner-scoped responsive surfaces.
 * Reproduce locally: node scripts/codemods/chat18-secondary-mobile-proof.cjs
 * This does not execute the LMS, compile TSX, or establish browser computed styles.
 * Exact old LMS reference: docs/design/legacy-styles/components___listing-page-header.scss,
 * max-width 767px, mobile full-width create button/search and min 44px search input.
 */
const fs=require("node:fs"),path=require("node:path"),root=path.resolve(__dirname,"../..");
const files=[["src/components/tracker/tracker-issue-bulk-actions.tsx","md:w-[220px]","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/tracker/tracker-issue-saved-views.tsx","md:w-[220px]","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/tracker/tracker-issue-logs-panel.tsx","min-h-11 items-center font-semibold","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/tracker/tracker-report-form.tsx","border-y border-border py-4","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/tracker/tracker-workflow-panel.tsx","flex flex-wrap gap-2","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/tracker/independent-finding-actions.tsx","grid min-w-0 w-full gap-1","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/tracker/audit-finding-status-action.tsx","md:w-[220px]","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/tracker/tracker-live-logs-explorer.tsx","md:w-[150px]","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/tracker/known-errors-workspace.tsx","mt-1 min-h-11 md:min-h-9","min-h-11 md:min-h-9"],["src/components/tracker/tracker-telegram-manual-panel.tsx","flex min-w-0 flex-wrap gap-3","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/hr/hr-notification-read-button.tsx","flex-col items-stretch","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/hr/recruiter-conversation-read-control.tsx","space-y-2","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/hr/recruiter-conversation-reply-form.tsx","min-w-0 flex-wrap items-center","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/hr/recruiter-decision-read-button.tsx","mt-2","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/tracker/tracker-issue-copy-actions.tsx","flex-col items-stretch","min-h-11 w-full md:min-h-9 md:w-auto"],["src/components/tracker/independent-finding-copy-action.tsx","min-w-0 space-y-1","min-h-11 w-full md:min-h-9 md:w-auto"]];
const counts={files:0,rawControls:0,ownH1:0,hardcodedHex:0,customOverlays:0};
for(const [file,layout,action] of files){
 const s=fs.readFileSync(path.join(root,file),"utf8");
 for(const expected of [layout,action]){
  if(!s.includes(expected))throw Error(file+" missing required responsive declaration "+expected);
 }
 for(const [name,re] of [
  ["rawControls",/<(?:button|select|input|textarea|table)\b/g],
  ["ownH1",/<h1\b/g],
  ["hardcodedHex",/#[0-9a-fA-F]{6}\b/g],
  ["customOverlays",/fixed\s+inset-0|role=["'](?:dialog|alertdialog)["']/g]
 ]){
  const n=(s.match(re)||[]).length;counts[name]+=n;
  if(n)throw Error(file+" includes "+n+" own "+name);
 }
 counts.files++;
 process.stdout.write(file+" | "+layout+" | "+action+" | raw=0 hex=0 overlay=0\n");
}
if(counts.files!==16)throw Error("Source queue unexpectedly changed");
process.stdout.write(JSON.stringify(counts)+"\n");
