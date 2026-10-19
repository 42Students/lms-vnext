#!/usr/bin/env node
"use strict";
/**
 * chat-1 owned learner page breakpoint + mobile tap-target source codemod.
 * Legacy learn-notifications.scss uses $learn-mobile-bp: 767px.
 * Re-runnable: node scripts/codemods/chat1-learner-page-responsive.cjs [--apply].
 * Default dry run, validates TSX syntax before write, never touches courses.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.join(process.cwd(),"src/app/(authenticated)/learn");
const files = [
  "my-placements/announcements/page.tsx",
  "my-placements/offers/page.tsx",
  "my-placements/assessments/page.tsx",
  "my-placements/rules/page.tsx",
  "my-placements/placement/page.tsx",
  "my-placements/schedule/page.tsx",
  "my-placements/jobs/page.tsx",
  "my-placements/applications/page.tsx",
  "my-placements/support/page.tsx",
  "my-placements/preparation/page.tsx",
  "attendance/calendar/page.tsx",
];
const rewrites = [
  ["sm:min-h-9","md:min-h-9"],
  ["sm:grid-cols-2","md:grid-cols-2"],
  ["sm:grid-cols-3","md:grid-cols-3"],
  ["sm:grid-cols-4","md:grid-cols-4"],
  ["sm:col-span-3","md:col-span-3"],
  ["sm:p-5","md:p-5"],
  ["sm:p-6","md:p-6"],
  ["sm:flex-row","md:flex-row"],
  ["sm:items-start","md:items-start"],
  ["sm:justify-between","md:justify-between"],
  ["sm:max-w-full","md:max-w-full"],
  ["sm:flex-wrap","md:flex-wrap"],
  ["sm:overflow-visible","md:overflow-visible"],
  ["sm:pb-0","md:pb-0"],
  ["inline-flex min-h-9","inline-flex min-h-11 md:min-h-9"],
];
const apply = process.argv.includes("--apply");
const out = [];let failures=0;
for(const rel of files){
  const file=path.join(root,rel);
  try{
    const original=fs.readFileSync(file,"utf8");
    let next=original;
    for(const [a,b] of rewrites)next=next.split(a).join(b);
    next=next.replace(/md:min-h-9 md:min-h-9/g,"md:min-h-9");
    const parsed=ts.createSourceFile(file,next,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    if(parsed.parseDiagnostics.length)throw Error("TSX parse diagnostics");
    if(apply&&next!==original)fs.writeFileSync(file,next,"utf8");
    out.push({file:rel,changed:next!==original});
  }catch(err){failures++;out.push({file:rel,error:String(err)});}
}
process.stdout.write(JSON.stringify({mode:apply?"apply":"dry-run",files:out},null,2)+"\n");
if(failures)process.exitCode=1;
