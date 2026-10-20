#!/usr/bin/env node
"use strict";
/**
 * Lane chat-1 only. Legacy learner mobile breakpoint is 767px, so Tailwind's
 * sm (640px) is not the correct control/card layout boundary.
 *
 * Usage: node scripts/codemods/chat1-learner-rounds-responsive.cjs [--apply]
 * Dry-run by default. Does not execute app, tests or mutate other lanes.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const paths = [
  "src/components/placements/learner-career-rounds-workspace.tsx",
  "src/components/placements/learner-career-rounds.tsx",
  "src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx",
  "src/app/(authenticated)/learn/my-placements/assessments/page.tsx",
];
const conversions = [
  ["sm:min-h-9","md:min-h-9"],
  ["sm:grid-cols-2","md:grid-cols-2"],
  ["sm:grid-cols-3","md:grid-cols-3"],
  ["sm:p-5","md:p-6"],
  ["sm:p-6","md:p-6"],
  ["sm:flex-row","md:flex-row"],
  ["sm:items-start","md:items-start"],
  ["sm:justify-between","md:justify-between"],
  ["sm:w-auto","md:w-auto"],
  ["sm:hidden","md:hidden"],
  ["sm:flex-wrap","md:flex-wrap"],
];
const apply = process.argv.includes("--apply");
const records = [];
let failures = 0;
for (const rel of paths) {
  const file = path.join(process.cwd(),rel);
  try {
    const old = fs.readFileSync(file,"utf8");
    let next = old;
    const counts = {};
    for (const [from,to] of conversions) {
      const n = next.split(from).length - 1;
      if(n) {
        next = next.split(from).join(to);
        counts[from]=n;
      }
    }
    const ast = ts.createSourceFile(file,next,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    if(ast.parseDiagnostics.length) throw Error("Invalid TSX syntax after conversion");
    if(apply && next !== old) fs.writeFileSync(file,next,"utf8");
    records.push({file:rel,changed:next!==old,counts});
  } catch(error) {
    failures++;
    records.push({file:rel,error:String(error)});
  }
}
process.stdout.write(JSON.stringify({mode:apply?"apply":"dry-run",records},null,2)+"\n");
if(failures)process.exitCode=1;
