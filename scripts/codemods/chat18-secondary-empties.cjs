#!/usr/bin/env node
"use strict";
// chat-18: replace inline empty-state markup with the shared EmptyState on
// four explicitly owned HR-secondary/tracker surfaces. No global substitutions.
// Usage: node scripts/codemods/chat18-secondary-empties.cjs [--dry-run]
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const files=[
 "src/app/(authenticated)/hr/activity/page.tsx",
 "src/app/(authenticated)/hr/calendar/page.tsx",
 "src/components/tracker/known-errors-workspace.tsx",
 "src/components/tracker/tracker-live-logs-explorer.tsx",
 "src/app/(authenticated)/hr/conversations/page.tsx",
 "src/app/(authenticated)/hr/conversations/[threadId]/page.tsx",
 "src/app/(authenticated)/tracker/audit-findings/page.tsx"
];
for(const name of files){
 const file=path.join(root,name);
 let content=fs.readFileSync(file,"utf8");
 const before=content;
 if(!/from ["']@\/components\/ui\/empty-state["']/.test(content)){
  content='import { EmptyState } from "@/components/ui/empty-state";\n'+content;
 }
 if(name.includes("hr/activity")){
  content=content.replace(/<p role="status" className="border-y border-border py-5 text-sm text-body">\s*No visible publication or closure activity at this college\.\s*<\/p>/,
   '<EmptyState title="No hiring activity" description="No visible publication or closure activity at this college."/>');
 }else if(name.includes("hr/calendar")){
  content=content.replace('<p className="mt-3 text-sm text-muted-foreground">No results deadlines are recorded in this calendar period.</p>',
   '<EmptyState title="No results due" description="No results deadlines are recorded in this calendar period."/>');
  content=content.replace(/<section\s+role="status"\s+className="border-b border-border py-8 text-center"\s*>[\s\S]*?Rounds, slots and deadlines appear here as soon as they are dated\.[\s\S]*?<\/section>/,
   '<EmptyState title={view==="week"?"Nothing scheduled this week":"Nothing scheduled this period"} description="Rounds, slots and deadlines appear here as soon as they are dated."/>');
 }else if(name.includes("known-errors")){
  content=content.replace(/<p className="border-y border-border py-6 text-sm text-muted-foreground">\s*No tracked errors yet\. This does not prove that live Cloud Logging contains no errors\.\s*<\/p>/,
   '<EmptyState title="No tracked errors" description="This does not prove that live Cloud Logging contains no errors."/>');
 }else if(name.includes("tracker/audit-findings/page")){
  content=content.replace('<p role="status" className="text-sm text-body">Review importer logs for the remaining details.</p>',
   '<EmptyState title="No import details" description="Review importer logs for the remaining details."/>');
  content=content.replace('<p role="status" className="text-sm text-body">No independent audit findings match these filters.</p>',
   '<EmptyState title="No matching audit findings" description="No independent audit findings match these filters."/>');
 }else if(name.includes("hr/conversations/[threadId]")){
  content=content.replace('<p role="status" className="border-y border-border py-5 text-body">No messages on this page.</p>',
   '<EmptyState title="No messages" description="No messages on this page."/>');
 }else if(name.includes("hr/conversations")){
  content=content.replace('<p role="status" className="border-y border-border py-5 text-body">No matching conversations with the placement cell for this college.</p>',
   '<EmptyState title="No matching conversations" description="No matching conversations with the placement cell for this college."/>');
 }else{
  content=content.replace('<p role="status" className="text-sm text-body">No live errors loaded.</p>',
   '<EmptyState title="No live errors loaded" description="Load or refresh live logs to see the latest authorized error events."/>');
 }
 if(content!==before){
  if(process.argv.includes("--dry-run"))console.log("Would change "+name);
  else {fs.writeFileSync(file,content);console.log("Changed "+name);}
 }else console.log("No match "+name);
}
