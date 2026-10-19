#!/usr/bin/env node
"use strict";
/** [chat-18] Legacy search width and mobile control parity.
 * Source: docs/design/legacy-styles/components___listing-page-header.scss:85-102,131-164.
 * Checked desktop search 220px / min-height 44px; mobile full width at <=767px.
 * Run: node scripts/codemods/chat18-search-width.cjs --dry-run
 */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const changes=[{"path":"src/app/(authenticated)/hr/activity/page.tsx","replacements":[["className=\"min-w-0 w-full basis-full md:min-w-48 md:basis-auto md:flex-1\"","className=\"min-h-11 min-w-0 w-full basis-full md:w-[220px] md:basis-auto md:flex-none\""],["className=\"min-h-11 md:min-h-9\">Search","className=\"min-h-11 w-full md:min-h-9 md:w-auto\">Search"]]},{"path":"src/app/(authenticated)/hr/notifications/page.tsx","replacements":[["className=\"min-w-0 w-full basis-full md:min-w-48 md:basis-auto md:flex-1\"","className=\"min-h-11 min-w-0 w-full basis-full md:w-[220px] md:basis-auto md:flex-none\""],["className=\"min-h-11 md:min-h-9\">Search","className=\"min-h-11 w-full md:min-h-9 md:w-auto\">Search"]]},{"path":"src/app/(authenticated)/hr/company/page.tsx","replacements":[["className=\"min-w-0 w-full basis-full md:min-w-48 md:basis-auto md:flex-1\"","className=\"min-h-11 min-w-0 w-full basis-full md:w-[220px] md:basis-auto md:flex-none\""],["className=\"min-h-11 md:min-h-9\">Search","className=\"min-h-11 w-full md:min-h-9 md:w-auto\">Search"]]},{"path":"src/app/(authenticated)/hr/conversations/page.tsx","replacements":[["className=\"min-w-0 basis-full text-sm text-body md:basis-auto md:flex-1\"","className=\"min-w-0 w-full basis-full text-sm text-body md:w-[220px] md:basis-auto md:flex-none\""],["<Input name=\"q\" maxLength={120} defaultValue={parsed.data.q} className=\"mt-1 w-full\"/>","<Input name=\"q\" maxLength={120} defaultValue={parsed.data.q} className=\"mt-1 min-h-11 w-full\"/>"],["className=\"min-h-11 self-end md:min-h-9\">Search","className=\"min-h-11 w-full self-end md:min-h-9 md:w-auto\">Search"]]},{"path":"src/components/tracker/tracker-report-form.tsx","replacements":[["className={field+\" min-w-0 w-full basis-full md:min-w-48 md:basis-auto md:flex-1\"}","className={field+\" min-h-11 min-w-0 w-full basis-full md:w-[220px] md:basis-auto md:flex-none\"}"],["variant=\"secondary\" className=\"min-h-11 md:min-h-9\">","variant=\"secondary\" className=\"min-h-11 w-full md:min-h-9 md:w-auto\">"]]}];
const dry=process.argv.includes("--dry-run");
for(const entry of changes){
 const filename=path.join(root,entry.path);
 let source=fs.readFileSync(filename,"utf8"), n=0;
 for(const [from,to] of entry.replacements){
  if(source.includes(to))continue;
  if(source.split(from).length!==2)throw Error(entry.path+": non-unique "+from);
  source=source.replace(from,to);n++;
 }
 if(n&&!dry)fs.writeFileSync(filename,source);
 process.stdout.write(entry.path+" "+(dry?"would-change":"changed")+" "+n+"\n");
}
