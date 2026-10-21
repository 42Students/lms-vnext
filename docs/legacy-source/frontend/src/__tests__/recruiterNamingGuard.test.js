/**
 * One name per thing (backend docs/naming/RECRUITER-NAMING-PLAN-2026-10-05.md): a person a college reaches out to is a "recruiter lead",
 * one who joined is a "recruiter". No TPO, recruiter or super admin screen may say "lead" on its own or call a person "HR".
 * "HR" as the interview round type is fine ("HR interview", "Test, Technical, HR").
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..");
const ROOTS = ["pages/tpo", "pages/recruiter", "pages/recruiter-invite", "components/tpo", "components/recruiter",
  "pages/superadmin/recruiters.js", "pages/superadmin/sections/RecruiterAccounts.js"];

function files(rel) {
  const abs = path.join(SRC, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [abs];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((d) => {
    if (d.name === "__tests__") return [];
    const p = path.join(abs, d.name);
    return d.isDirectory() ? files(path.relative(SRC, p)) : /\.(js|jsx)$/.test(d.name) ? [p] : [];
  });
}

/** Text a user can read: string literals with a space in them (sentences, labels) and JSX text. Comments are dropped first. */
function visibleTexts(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
  const out = [];
  for (const m of code.matchAll(/"([^"\n]*\s[^"\n]*)"|'([^'\n]*\s[^'\n]*)'|`([^`\n]*\s[^`\n]*)`/g)) out.push(m[1] || m[2] || m[3]);
  for (const m of code.matchAll(/>([^<>{}\n]*[A-Za-z][^<>{}\n]*)</g)) out.push(m[1]);
  return out;
}

// A word, never part of a CSS class or a key ("tpo-recruiter-lead-detail", `lead-${id}`).
const LEAD_ALONE = /(?<![Rr]ecruiter[ -])(?<![\w-])[Ll]eads?(?![\w-])/;
const HR_PERSON = /(?<![\w-])HRs?(?![\w-])/;
// "HR" next to round words is the interview round type.
const ROUND_CONTEXT = /\b(interview|round|Technical|Managerial|Screening)\b/i;

test("no screen says 'lead' on its own or calls a person 'HR'", () => {
  const offenders = [];
  ROOTS.flatMap(files).forEach((file) => {
    visibleTexts(fs.readFileSync(file, "utf8")).forEach((t) => {
      if (LEAD_ALONE.test(t) || (HR_PERSON.test(t) && !ROUND_CONTEXT.test(t))) offenders.push(`${path.relative(SRC, file)}: ${t.trim().slice(0, 100)}`);
    });
  });
  expect(offenders).toEqual([]);
});
