#!/usr/bin/env node
"use strict";
/**
 * Chat-18 deterministic source-level parity audit (read-only).
 * Re-run locally after any source changes:
 *   node scripts/codemods/chat18-secondary-parity-check.cjs
 *
 * The separate strict visual check requires actual computed CSS and
 * old-vs-vNext 375/768/1280px captures. This script does not satisfy it.
 */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const queue=read("docs/audit/ux/clone-hr-secondary.md");
const files=[...new Set([...queue.matchAll(/^- \[[ x]\] `(src\/[^\`]+\.tsx)`/gm)].map(m=>m[1]))];
if(files.length!==87)throw new Error("Queue expected 87 TSX paths, found "+files.length);
const counts={files:files.length,visibleRaw:0,hiddenRaw:0,ownH1:0,hex:0,handTabs:0,overlayTextHits:0};
const exceptions={hidden:[],selector:[]};
for(const f of files){
 const content=read(f);
 const tags=[...content.matchAll(/<(button|input|select|textarea|table)\b[^>]*>/g)].map(m=>m[0]);
 for(const tag of tags){
  if(/^<input\b/.test(tag)&&/\btype=["']hidden["']/.test(tag)){
   counts.hiddenRaw++;exceptions.hidden.push(f);continue;
  }
  counts.visibleRaw++;
 }
 counts.ownH1+=(content.match(/<h1\b/g)||[]).length;
 counts.hex+=(content.match(/#[0-9a-fA-F]{6}\b/g)||[]).length;
 counts.handTabs+=(content.match(/border-b-2\b/g)||[]).length;
 const hit=(content.match(/fixed\s+inset-0|role=["'](?:dialog|alertdialog)["']/g)||[]).length;
 counts.overlayTextHits+=hit;
 if(hit)exceptions.selector.push(f);
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
if(!same(counts,{files:87,visibleRaw:0,hiddenRaw:1,ownH1:0,hex:0,handTabs:0,overlayTextHits:1}))
 throw new Error("Source patterns drifted: "+JSON.stringify(counts));
if(!same(exceptions.hidden,["src/app/(authenticated)/tracker/audit-findings/page.tsx"]))
 throw new Error("New raw hidden control exemption");
if(!same(exceptions.selector,["src/components/hr/recruiter-conversation-live-refresh.tsx"]))
 throw new Error("Unexpected overlay pattern; check whether it renders a custom overlay");
const checks=[
 ["Recruiter 7-column board", "src/components/hr/recruiter-calendar-legacy.module.css", /\.board\[data-slot="calendar-grid"\]\s*\{[\s\S]*?grid-template-columns:\s*repeat\(7,\s*minmax\(150px,\s*1fr\)\);[\s\S]*?gap:\s*10px;/],
 ["Audit detail back link belongs to the page head", "src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx", /<PageHeader title=\{finding\.title\}[\s\S]*?actions=\{<Link href="\/tracker\/audit-findings"/],
 ["Reporter detail back link belongs to the page head", "src/app/(authenticated)/tracker/mine/[publicId]/page.tsx", /<PageHeader title=\{report\.publicId\}[\s\S]*?actions=\{<Link href="\/tracker\/mine"/],
 ["Reporter new issue action belongs to the page head", "src/app/(authenticated)/tracker/mine/page.tsx", /<PageHeader title="My reports"[\s\S]*?actions=\{<Link href="\/tracker"/],
 ["HR activity export sits in the legacy page head", "src/app/(authenticated)/hr/activity/page.tsx", /<PageHeader title="Hiring activity"[\s\S]*?actions=\{result\.status==="READY"\?<Link/],
 ["HR notification actions sit in the legacy page head", "src/app/(authenticated)/hr/notifications/page.tsx", /<PageHeader title="Notifications"[\s\S]*?actions=\{<>/],
 ["Recruiter calendar occupied mobile days", "src/app/(authenticated)/hr/calendar/page.tsx", /min-\[861px\]:hidden/],
 ["Recruiter calendar seven columns at 861px", "src/app/(authenticated)/hr/calendar/page.tsx", /min-\[861px\]:grid/],
 ["Calendar current date blue", "src/components/hr/recruiter-calendar-legacy.module.css", /\.day\[data-today="true"\][\s\S]*?border-color:\s*#2f6fed;/],
 ["Calendar event hover", "src/components/hr/recruiter-calendar-legacy.module.css", /\.event:hover\s*\{\s*background:\s*#f6f8fb/],
 ["Known Errors fields remain stacked to 767px", "src/components/tracker/known-errors-workspace.tsx", /className="grid gap-3 md:grid-cols-3"/],
 ["Live log mobile full-width search", "src/components/tracker/tracker-live-logs-explorer.tsx", /className="grid w-full min-w-0 basis-full[^"]+md:basis-auto/],
 ["HR secondary legacy 220px search", "src/app/(authenticated)/hr/notifications/page.tsx", /min-h-11[^"]*md:w-\[220px\]/],
 ["Tracker workflow mobile touch targets", "src/components/tracker/tracker-workflow-panel.tsx", /min-h-11 md:min-h-9/],
 ["Tracker notifications use shared error state", "src/app/(authenticated)/hr/activity/error.tsx", /<ErrorState title="Hiring activity could not load"/],
];
for(const [label,file,pattern] of checks){
 if(!pattern.test(read(file)))throw new Error(label+" source parity declaration missing");
}
// Strip CSS comments before checking computed display provenance. Source
// comments may deliberately mention "display:grid" while the declaration
// must remain owned by CalendarGrid so .hidden works at <=860px.
const recruiterCss=read("src/components/hr/recruiter-calendar-legacy.module.css")
  .replace(/\/\*[\s\S]*?\*\//g,"");
const boardRule=recruiterCss.match(/\.board\[data-slot="calendar-grid"\]\s*\{([^}]+)\}/);
if(!boardRule||/(?:^|;)\s*display\s*:/i.test(boardRule[1]))
 throw new Error("Recruiter board overrides display and breaks mobile hidden state");
process.stdout.write(JSON.stringify({counts,exceptions,checks:checks.map(c=>c[0]),scope:"source only — no browser/CI"},null,2)+"\n");
