#!/usr/bin/env node
"use strict";
/**
 * Scope: chat-1 learner academic-evidence and placement-request JSX only.
 * Converts the four data-driven native academic fields/checkbox and the two
 * request-reason textareas that broad codemods could not migrate safely.
 * Dry run by default, --apply writes only after per-file TSX parse validation.
 * Existing shared controls and user-controlled values/handlers are preserved.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const apply = process.argv.includes("--apply");
const root = process.cwd();
const files = [
  "src/components/placements/learner-placement-academic-evidence.tsx",
  "src/components/placements/learner-placement-requests.tsx",
];
function edit(text, before, after) {
  return text.includes(before) ? text.split(before).join(after) : text;
}
const reports = [];
for (const rel of files) {
  const file = path.join(root, rel);
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  if (rel.endsWith("learner-placement-academic-evidence.tsx")) {
    after = edit(after, 'import { Button } from "@/components/ui/button";',
      'import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";\nimport { Checkbox } from "@/components/ui/checkbox";');
    // An already-migrated source has no raw input nodes, making re-runs safe.
    after = after.replace(/<input(?=\s+className=\{inputClass\})/g, "<Input");
    after = after.replace(/<input(?=\s+type="checkbox")/g, "<Checkbox");
    after = after.replace(/(<Checkbox\s+)type="checkbox"\s*/g, "$1");
    after = after.replace(/sm:min-h-9/g, "md:min-h-9");
    after = after.replace(/sm:grid-cols-2/g, "md:grid-cols-2");
    after = after.replace(/sm:flex-row/g, "md:flex-row").replace(/sm:items-start/g,"md:items-start");
    after = after.replace(/sm:justify-between/g, "md:justify-between");
    after = after.replace(/sm:col-span-2/g, "md:col-span-2");
  } else {
    after = edit(after, 'import { Input } from "@/components/ui/input";',
      'import { Input } from "@/components/ui/input";\nimport { Textarea } from "@/components/ui/textarea";');
    after = after.replace(/<textarea(?=\s)/g, "<Textarea");
    after = after.replace(/className=\{textareaClass\}/g, 'className="min-h-28"');
    after = after.replace(/sm:grid-cols-2/g, "md:grid-cols-2");
  }
  const parsed = ts.createSourceFile(file, after, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (parsed.parseDiagnostics.length || /<(?:input|textarea)(?=\s|>)/.test(after)) {
    throw new Error("TSX parser or raw-control guard failed: " + rel);
  }
  if (apply && after !== before) fs.writeFileSync(file, after, "utf8");
  reports.push({file:rel,changed:after!==before});
}
process.stdout.write(JSON.stringify({mode:apply?"apply":"dry-run",files:reports},null,2)+"\n");
