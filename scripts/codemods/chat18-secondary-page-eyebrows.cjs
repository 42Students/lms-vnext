#!/usr/bin/env node
"use strict";

/**
 * chat-18 secondary portal PageHeader visual parity codemod.
 * Old LMS renders the page title + inline description, never a separate portal
 * eyebrow. PageHeader already renders one inline row; remove static recruiter/
 * tracker identity eyebrow props without touching title, description or actions.
 * Matches are deliberately limited to the lane's route page files.
 *
 * Run: node scripts/codemods/chat18-secondary-page-eyebrows.cjs
 * Inspect only: node scripts/codemods/chat18-secondary-page-eyebrows.cjs --dry-run
 */
const fs = require("node:fs");
const path = require("node:path");

const roots = [
  "src/app/(authenticated)/hr/activity/page.tsx",
  "src/app/(authenticated)/hr/calendar/page.tsx",
  "src/app/(authenticated)/hr/colleges/page.tsx",
  "src/app/(authenticated)/hr/company/page.tsx",
  "src/app/(authenticated)/hr/company/reports/page.tsx",
  "src/app/(authenticated)/hr/conversations/page.tsx",
  "src/app/(authenticated)/hr/conversations/[threadId]/page.tsx",
  "src/app/(authenticated)/hr/notifications/page.tsx",
  "src/app/(authenticated)/tracker/audit-findings/page.tsx",
  "src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx",
  "src/app/(authenticated)/tracker/issues/page.tsx",
  "src/app/(authenticated)/tracker/issues/[publicId]/page.tsx",
  "src/app/(authenticated)/tracker/logs/page.tsx",
  "src/app/(authenticated)/tracker/mine/page.tsx",
  "src/app/(authenticated)/tracker/mine/[publicId]/page.tsx",
  "src/app/(authenticated)/tracker/page.tsx",
];

const projectRoot = path.resolve(__dirname, "../..");
const dryRun = process.argv.includes("--dry-run");
let changedFiles = 0;
let removedProps = 0;
for (const relative of roots) {
  const absolute = path.join(projectRoot, relative);
  if (!fs.existsSync(absolute)) continue;
  const before = fs.readFileSync(absolute, "utf8");
  let local = 0;
  // JSX tag-limited replacement: does not modify object literals or copy.
  // Static string props only; nonliteral eyebrow expressions need manual review.
  const after = before.replace(/(<PageHeader\b[^>]*?)\s+eyebrow\s*=\s*(?:"[^"]*"|'[^']*')/g, (_match, prefix) => {
    local += 1;
    return prefix;
  });
  if (after === before) continue;
  if (!after.includes("<PageHeader")) throw new Error("PageHeader lost: " + relative);
  changedFiles++;
  removedProps += local;
  if (!dryRun) fs.writeFileSync(absolute, after, "utf8");
  process.stdout.write((dryRun ? "WOULD CHANGE " : "CHANGED ") + relative + ": " + local + " static eyebrow props\n");
}
process.stdout.write((dryRun ? "DRY RUN" : "DONE") + ": " + changedFiles + " files, " + removedProps + " props\n");
