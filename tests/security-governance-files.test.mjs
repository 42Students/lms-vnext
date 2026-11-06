// Executable checks for repository governance controls (SEC-18-004, SEC-18-005, SEC-18-011,
// SEC-18-018, SEC-25-013). These assert the files and workflow settings exist and say what the
// controls require; they do not prove GitHub is enforcing them (branch protection is SEC-18-002).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("CODEOWNERS assigns an owner to every security-critical path", () => {
  assert.ok(existsSync(".github/CODEOWNERS"));
  const lines = read(".github/CODEOWNERS").split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  const owned = new Map(lines.map((l) => { const [path, ...owners] = l.trim().split(/\s+/); return [path, owners]; }));
  for (const path of ["/src/security/", "/src/db/", "/drizzle/", "/src/proxy.ts", "/src/modules/identity/", "/src/modules/storage/", "/.github/", "/docs/security/", "/package-lock.json", "/Dockerfile"]) {
    assert.ok(owned.has(path), `no owner for ${path}`);
    assert.ok(owned.get(path).every((o) => /^@[\w./-]+$/.test(o)) && owned.get(path).length > 0, `bad owner for ${path}`);
  }
});

test("Dependabot covers npm and GitHub Actions weekly", () => {
  const text = read(".github/dependabot.yml");
  assert.match(text, /package-ecosystem:\s*npm/);
  assert.match(text, /package-ecosystem:\s*github-actions/);
  assert.equal((text.match(/interval:\s*weekly/g) ?? []).length, 2);
});

test("SECURITY.md defines private reporting and fix deadlines", () => {
  const text = read("SECURITY.md");
  assert.match(text, /private vulnerability reporting/i);
  for (const [severity, days] of [["Critical", 7], ["High", 14], ["Moderate", 30], ["Low", 90]]) {
    assert.match(text, new RegExp(`\|\s*${severity}\s*\|\s*${days} days`), `${severity} deadline missing`);
  }
  assert.match(text, /exception/i);
});

test("the pull request template carries the security checklist", () => {
  const text = read(".github/pull_request_template.md");
  for (const phrase of ["No credentials", "selected role", "restricted runtime role", "Positive and negative tests", "code owner"]) {
    assert.match(text, new RegExp(phrase, "i"), `checklist item missing: ${phrase}`);
  }
});

test("every workflow declares least-privilege token permissions", () => {
  const workflows = readdirSync(".github/workflows").filter((f) => f.endsWith(".yml"));
  assert.ok(workflows.length > 50);
  const bad = [];
  for (const file of workflows) {
    const text = read(`.github/workflows/${file}`);
    const top = /^permissions:\s*(?:\r?\n((?:[ \t]+.*(?:\r?\n|$))+)|(\S.*))/m.exec(text);
    if (!top) { bad.push(`${file}: no top-level permissions`); continue; }
    const body = (top[1] ?? top[2] ?? "").toString();
    if (/write-all/.test(body)) bad.push(`${file}: write-all`);
    if (/contents:\s*write/.test(body)) bad.push(`${file}: contents: write at top level`);
  }
  assert.deepEqual(bad, []);
});
