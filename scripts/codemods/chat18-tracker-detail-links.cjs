#!/usr/bin/env node
"use strict";
/** [chat-18] Tracker detail/list actions 44px through 767px and 36px
 * afterwards (old-lms-shell.css:73-85, old-lms-shell-spec.md:23-24).
 * The unavailable issue uses the shared ErrorState, not a nested card.
 * Reproducible and idempotent: node scripts/codemods/chat18-tracker-detail-links.cjs --dry-run
 */
const fs=require("node:fs"),path=require("node:path"),root=path.resolve(__dirname,"../..");
const specs=[
 ["src/app/(authenticated)/tracker/page.tsx",[
  ["className=\"inline-flex min-h-9 items-center font-semibold text-primary-text underline","className=\"inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9",1]]],
 ["src/app/(authenticated)/tracker/mine/page.tsx",[
  ["className=\"font-semibold text-primary-text underline\"","className=\"inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9\"",3]]],
 ["src/app/(authenticated)/tracker/mine/[publicId]/page.tsx",[
  ["className=\"font-semibold text-primary-text underline\"","className=\"inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9\"",1]]],
 ["src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx",[
  ["className=\"inline-flex min-h-9 items-center font-semibold text-primary-text underline","className=\"inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9",2]]],
 ["src/app/(authenticated)/tracker/issues/[publicId]/page.tsx",[
  ["import { PageHeader } from \"@/components/ui/page-header\";","import { PageHeader } from \"@/components/ui/page-header\";\nimport { ErrorState } from \"@/components/ui/error-state\";",1],
  ["<p className=\"rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 text-sm text-body\">\n          We could not load tracker details right now. Please try again later.\n        </p>","<ErrorState title=\"Issue details unavailable\"\n          description=\"We could not load tracker details right now. Please try again later.\" />",1],
  ["className=\"grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3\"","className=\"grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3\"",1],
  ["min-h-[var(--lms-control-height)]","min-h-11 md:min-h-[var(--lms-control-height)]",3]]]
];
const dry=process.argv.includes("--dry-run");
for(const [file,changes] of specs){
 const filename=path.join(root,file);let content=fs.readFileSync(filename,"utf8"),n=0;
 for(const [oldValue,newValue,count] of changes){
  if(content.includes(newValue))continue;
  const found=content.split(oldValue).length-1;
  if(found!==count)throw Error(file+" expected "+count+" but found "+found+" for "+oldValue);
  content=content.replaceAll(oldValue,newValue);n+=found;
 }
 if(n&&!dry)fs.writeFileSync(filename,content);
 process.stdout.write(file+" "+n+"\n");
}
