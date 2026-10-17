#!/usr/bin/env node
/** Source guard for audited UX shared primitives and critical WebView workflows.
 * Keep the 320px/AA contract in reviewed code; expand scope each audit.
 * Existing unaudited legacy pages are tracked separately, not silently passed.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

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
  "src/app/quiz/page.tsx",
  "src/components/people/faculty-profile-text-section.tsx",
  "src/components/people/faculty-profile-repeatable.tsx",
  "src/components/people/faculty-profile-skills.tsx",
  "src/components/people/faculty-profile-metadata.tsx",
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
  const file=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function fail(node,label) {
    const line=file.getLineAndCharacterOfPosition(node.getStart(file)).line+1;
    failures.push(relative(cwd,join(cwd,path))+":"+line+": "+label);
  }
  function inspect(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(file)==="window" &&
      ["confirm","alert","prompt","open"].includes(node.expression.name.text)) {
      fail(node,"native prompt / unmanaged popup");
    }
    if (ts.isJsxAttribute(node)) {
      if(node.name.text==="target" && node.initializer &&
        ts.isStringLiteral(node.initializer) && node.initializer.text==="_blank") {
        fail(node,"new-window link");
      }
      if (node.name.text==="className" && node.initializer) {
        const classes=node.initializer.getText(file);
        if (/\bmin-h-10\b/.test(classes)) fail(node,"40px actionable class");
        if (/\bbg-primary\b/.test(classes) && /\btext-white\b/.test(classes)) fail(node,"white text on canonical teal");
      }
    }
    ts.forEachChild(node,inspect);
  }
  inspect(file);
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
