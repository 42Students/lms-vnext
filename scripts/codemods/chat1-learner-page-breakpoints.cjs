#!/usr/bin/env node
"use strict";
/**
 * Chat-1-only responsive audit migration. Legacy learner screens switch at
 * 767px (see docs/design/legacy-styles/components___learn-notifications.scss).
 * Repeatable, dry-run by default. Run --apply only in a local workstation.
 * Guards against TSX parse failures and excludes learn/courses/**.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.join(process.cwd(),"src/app/(authenticated)/learn");
const files = [
  "my-placements/rules/page.tsx",
  "my-placements/placement/page.tsx",
  "my-placements/announcements/page.tsx",
  "my-placements/offers/page.tsx",
  "profile/page.tsx",
  "profile/data-access/page.tsx",
  "profile/academic-record/page.tsx",
  "profile/completeness/page.tsx",
];
const pairs = [
  ["min-[768px]:min-h-9","md:min-h-9"],
  ["min-[768px]:flex-wrap","md:flex-wrap"],
  ["min-[768px]:overflow-visible","md:overflow-visible"],
  ["min-[768px]:pb-0","md:pb-0"],
  ["sm:min-h-9","md:min-h-9"],
  ["sm:grid-cols-2","md:grid-cols-2"],
  ["sm:flex-wrap","md:flex-wrap"],
  ["sm:text-[14px]","md:text-[14px]"],
  ["sm:p-6","md:p-6"],
];
const apply = process.argv.includes("--apply");
const changed = [];
for (const rel of files) {
  if(rel.startsWith("courses/"))throw Error("Cannot modify chat-7 learner courses");
  const file=path.join(root,rel);
  let content=fs.readFileSync(file,"utf8");
  let updated=content;
  for(const [from,to] of pairs) updated=updated.split(from).join(to);
  const source=ts.createSourceFile(file,updated,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  if(source.parseDiagnostics.length)throw Error("TSX parse failed for "+rel);
  if(apply && updated!==content)fs.writeFileSync(file,updated,"utf8");
  changed.push({file:rel,changed:updated!==content});
}
process.stdout.write(JSON.stringify({mode:apply?"apply":"dry-run",files:changed},null,2)+"\n");
