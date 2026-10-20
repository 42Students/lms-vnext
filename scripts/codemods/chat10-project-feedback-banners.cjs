"use strict";

// Scope: only chat-10 owned admin/college Projects components.
// Dry-run is the default; pass --write after reviewing the listed files.
// Changes the repeated custom success/error text to the shared legacy
// Banner. Keeps the existing conditions and message content unchanged.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const files = [
  "src/components/projects/super-admin-template-archive-control.tsx",
  "src/components/projects/super-admin-template-create-form.tsx",
  "src/components/projects/super-admin-template-overview-editor.tsx",
  "src/components/projects/super-admin-template-plan-editor.tsx",
  "src/components/projects/super-admin-template-resource-editor.tsx",
  "src/components/projects/super-admin-template-rollback-control.tsx",
  "src/components/projects/college-project-summary-editor.tsx",
  "src/components/projects/college-project-summary-editor-full.tsx",
  "src/components/projects/college-project-mentor-dialog.tsx",
  "src/components/projects/project-admin-submission-review.tsx",
];

const ternary = /\{(error|message|notice|success)\s*\?\s*<(p|span)\s+role="(alert|status)"\s+className="[^"]*">\{\1\}<\/\2>\s*:\s*null\}/g;
const conjunction = /\{(error|message|notice|success)\s*&&\s*<(p|span)\s+role="(alert|status)"\s+className="[^"]*">\{\1\}<\/\2>\}/g;
const bannerImport = 'import { Banner } from "@/components/ui/banner";';
const drafts = [];

for (const relativePath of files) {
  const absolutePath = path.join(root, relativePath);
  const original = fs.readFileSync(absolutePath, "utf8");
  if (!original.startsWith('"use client";')) {
    throw new Error(relativePath + ": expected client component, refused to change");
  }

  let replacements = 0;
  const tone = (name, role) => role === "alert" || name === "error" ? "error" : "success";
  let updated = original.replace(ternary, (_matched, name, _tag, role) => {
    replacements += 1;
    return `{${name} ? <Banner tone="${tone(name, role)}">{${name}}</Banner> : null}`;
  }).replace(conjunction, (_matched, name, _tag, role) => {
    replacements += 1;
    return `{${name} && <Banner tone="${tone(name, role)}">{${name}}</Banner>}`;
  });

  if (replacements === 0) {
    process.stdout.write(relativePath + ": already migrated or no matching inline notice; unchanged\n");
    continue;
  }
  if (!updated.includes(bannerImport)) {
    const afterDirective = updated.indexOf("\n") + 1;
    updated = updated.slice(0, afterDirective) + bannerImport + "\n" + updated.slice(afterDirective);
  }
  if (updated.includes("<p role=\"alert\"") && updated.includes("{error}")) {
    // Other error paragraphs may have a different semantic purpose; do not guess.
    process.stderr.write(relativePath + ": review remaining inline alerts manually\n");
  }
  drafts.push({ relativePath, absolutePath, updated, replacements });
}

for (const item of drafts) {
  process.stdout.write(item.relativePath + ": " + item.replacements + " feedback notices\n");
}
if (process.argv.includes("--write")) {
  for (const item of drafts) {
    fs.writeFileSync(item.absolutePath, item.updated, "utf8");
  }
  process.stdout.write("Written: inspect JSX, run scoped grep and TypeScript gate before ticking any files.\n");
} else {
  process.stdout.write("Dry run only. Pass --write to apply after review.\n");
}
