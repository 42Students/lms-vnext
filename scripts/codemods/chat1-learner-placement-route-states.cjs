#!/usr/bin/env node
"use strict";
/**
 * Chat-1 owned learner my-placements route-state source migration.
 * Applies only idempotent 767px breakpoint and retry-row equivalents;
 * leaves title, error wording and action behavior unchanged.
 * Default DRY RUN. Pass --apply to write. A local TSX parser guards writes.
 */
const fs=require("node:fs");
const path=require("node:path");
const ts=require("typescript");
const base=path.join(process.cwd(),"src/app/(authenticated)/learn/my-placements");
const files=[
 "rules/error.tsx","placement/error.tsx","offers/error.tsx",
 "announcements/error.tsx","preparation/error.tsx","support/error.tsx",
 "applications/error.tsx","assessments/error.tsx","interviews/error.tsx",
 "calendar/error.tsx",
];
const rewrites=[
 ["sm:min-h-9","md:min-h-9"],
 ['className="flex flex-wrap justify-center gap-3"',
  'className="flex min-w-0 flex-wrap items-center gap-3"'],
 ['className="py-6 text-center"','className="min-w-0 space-y-4"'],
 ['<Button variant="secondary" onClick={reset}>',
  '<Button className="max-md:min-h-11" variant="secondary" onClick={reset}>'],
 ['<Button onClick={reset}>',
  '<Button className="max-md:min-h-11" onClick={reset}>'],
];
const apply=process.argv.includes("--apply");
let failed=0;const report=[];
for(const rel of files) {
 const file=path.join(base,rel);
 try{
  const old=fs.readFileSync(file,"utf8");
  let next=old;
  for(const [from,to] of rewrites)next=next.split(from).join(to);
  const parsed=ts.createSourceFile(file,next,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  if(parsed.parseDiagnostics.length)throw Error("TSX parse error");
  if(apply&&next!==old)fs.writeFileSync(file,next,"utf8");
  report.push({path:rel,changed:next!==old});
 }catch(error){failed++;report.push({path:rel,error:String(error)});}
}
process.stdout.write(JSON.stringify({mode:apply?"apply":"dry-run",report},null,2)+"\n");
if(failed)process.exitCode=1;
