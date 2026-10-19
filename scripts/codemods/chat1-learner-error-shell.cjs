#!/usr/bin/env node
"use strict";
/**
 * Chat-1: route error pages use one LMS canvas and the legacy 767px phone
 * breakpoint. Default is dry-run. Only applies known class token changes
 * and verifies TSX parsing; existing copy and retry handlers are untouched.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const targets = [
  "attendance/error.tsx",
  "calendar/error.tsx",
  "profile/error.tsx",
  "projects/error.tsx",
  "notifications/error.tsx",
  "my-placements/error.tsx",
];
const root = path.join(process.cwd(), "src/app/(authenticated)/learn");
const apply = process.argv.includes("--apply");
const results = [];
for (const rel of targets) {
  const file=path.join(root,rel);
  const old=fs.readFileSync(file,"utf8");
  let next=old;
  const classPairs = [
    ['className="space-y-3"','className="min-w-0 space-y-4"'],
    ['className="space-y-3 py-6"','className="min-w-0 space-y-4"'],
    ['className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body"',
      'className="mt-2 max-w-2xl text-sm leading-6 text-body"'],
    ['className="mt-5 flex justify-center"',
      'className="mt-5 flex flex-wrap items-center gap-3"'],
    ['className="mt-5 flex flex-wrap justify-center gap-3"',
      'className="mt-5 flex flex-wrap items-center gap-3"'],
    ['<Button onClick={reset}>','<Button className="max-md:min-h-11" onClick={reset}>'],
    ['sm:min-h-9','md:min-h-9'],
  ];
  for(const [from,to] of classPairs)next=next.split(from).join(to);
  const parsed=ts.createSourceFile(file,next,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  if(parsed.parseDiagnostics.length)throw Error("Invalid TSX: "+rel);
  if(apply&&next!==old)fs.writeFileSync(file,next,"utf8");
  results.push({file:rel,changed:old!==next});
}
process.stdout.write(JSON.stringify({mode:apply?"apply":"dry-run",results},null,2)+"\n");
