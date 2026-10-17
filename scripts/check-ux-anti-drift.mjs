#!/usr/bin/env node
/** Source guard for audited UX shared primitives and critical WebView workflows.
 * Keep the 320px/AA contract in reviewed code; expand scope each audit.
 * Existing unaudited legacy pages are tracked separately, not silently passed.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const cwd = process.cwd();
const audited = [
  "src/components/ui",
  "src/components/courses/learner-quiz-attempt.tsx",
  "src/app/(authenticated)/tpo/students/page.tsx",
  "src/components/tpo/tpo-students-spreadsheet.tsx",
  "src/components/tpo/tpo-spreadsheet-grid.tsx",
  "src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx",
  "src/components/placements/placement-drive-workspace.tsx",
  "src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx",
  "src/app/(authenticated)/admin/colleges/page.tsx",
  "src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx",
  "src/app/(authenticated)/tpo/calendar/page.tsx",
];
const rules = [
  ["native confirm/alert/prompt", /\bwindow\.(?:confirm|alert|prompt)\s*\(/g],
  ["unmanaged window popup", /\bwindow\.open\s*\(/g],
  ["new-window link", /\btarget\s*=\s*["']_blank["']/g],
  ["40px actionable class", /\bmin-h-10\b/g],
];
const sources = [];
function walk(target) {
  try {
    const entries = readdirSync(join(cwd,target), { withFileTypes:true });
    for (const entry of entries) {
      const path=join(target,entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/[.]tsx?$/.test(path)) sources.push(path);
    }
  } catch { if (/[.]tsx?$/.test(target)) sources.push(target); }
}
for (const path of audited) walk(path);
const failures=[];
for (const path of [...new Set(sources)]) {
  let text;
  try { text=readFileSync(join(cwd,path),"utf8"); } catch { failures.push(path+": missing"); continue; }
  for (const [label,regex] of rules) {
    const matches=Array.from(text.matchAll(regex));
    for (const match of matches) {
      const line=text.slice(0,match.index).split("\n").length;
      failures.push(`${relative(cwd,join(cwd,path))}:${line}: ${label}`);
    }
  }
}
const css=readFileSync(join(cwd,"src/app/globals.css"),"utf8");
for(const required of [
  "--primary-foreground: var(--lms-on-primary)",
  "--lms-on-primary: #1a1d21",
  "--color-primary-text: var(--lms-link-text)",
]) if(!css.includes(required))failures.push("globals.css missing contrast-safe alias: "+required);
if (failures.length) {
  process.stderr.write("UX anti-drift violations:\n"+failures.join("\n")+"\n");
  process.exitCode=1;
} else {
  process.stdout.write(`UX anti-drift source guard passed (${sources.length} files). Browser/AT checks remain separate.\n`);
}
