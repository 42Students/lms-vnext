#!/usr/bin/env node
// G4 report export anchor skin codemod. Dry-run by default; --apply writes files.
// This deliberately preserves hrefs, download names, layout utilities and JSX tags.
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const apply = process.argv.includes("--apply");
const files = [
  "src/app/(authenticated)/tpo/reports/placed-branch/page.tsx",
  "src/app/(authenticated)/tpo/reports/season-pipeline/page.tsx",
  "src/app/(authenticated)/tpo/reports/intelligence/page.tsx",
  "src/app/(authenticated)/tpo/reports/offers-expiry/page.tsx",
  "src/app/(authenticated)/tpo/reports/branch-season/page.tsx",
  "src/app/(authenticated)/tpo/reports/accreditation/page.tsx",
  "src/app/(authenticated)/tpo/reports/page.tsx",
  "src/components/placements/placement-report-ui.tsx",
];
const remap = new Map([
  ["bg-primary", "bg-[var(--lms-button-primary)]"],
  ["border-primary", "border-[var(--lms-button-primary)]"],
  ["text-on-primary", "text-[var(--lms-on-primary)]"],
  ["text-primary-foreground", "text-[var(--lms-on-primary)]"],
  ["text-white", "text-[var(--lms-on-primary)]"],
  ["hover:bg-primary-hover", "hover:bg-[var(--lms-button-primary-hover)]"],
  ["hover:border-primary-hover", "hover:border-[var(--lms-button-primary-hover)]"],
]);
let touched = 0;
for (const relative of files) {
  const absolute = path.join(process.cwd(), relative);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, "utf8");
  const file = ts.createSourceFile(absolute, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function visit(node) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(file) === "a") {
      const props = node.attributes.properties;
      const href = props.find(p => ts.isJsxAttribute(p) && p.name.getText(file) === "href");
      const style = props.find(p => ts.isJsxAttribute(p) && p.name.getText(file) === "className");
      if (href && style && style.initializer && ts.isStringLiteral(style.initializer)) {
        const hrefText = href.getText(file);
        const anchorText = node.parent.getText(file);
        const isReportExport = /\/api\/placements\/reports/.test(hrefText) ||
          /(?:Export|Download) (?:filtered |shown )?CSV/i.test(anchorText);
        if (isReportExport) {
          const oldClass = style.initializer.text;
          const tokens = oldClass.split(/\s+/);
          if (tokens.includes("bg-primary")) {
            const next = tokens.map(token => remap.get(token) ?? token).join(" ");
            if (next !== oldClass) edits.push({
              start: style.initializer.getStart(file),
              end: style.initializer.getEnd(),
              replacement: JSON.stringify(next),
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (!edits.length) continue;
  let out = source;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    out = out.slice(0, edit.start) + edit.replacement + out.slice(edit.end);
  touched += edits.length;
  process.stdout.write(relative + ": " + edits.length + " export link(s)\n");
  if (apply) fs.writeFileSync(absolute, out, "utf8");
}
process.stdout.write((apply ? "Updated" : "Would update") + " " + touched + " report link(s)\n");
