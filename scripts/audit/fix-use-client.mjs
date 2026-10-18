// Ensures "use client" / "use server" directives are the very first statement. Moves a misplaced directive to line 1.
// Usage: node scripts/audit/fix-use-client.mjs [--check]
import fs from "node:fs";
import path from "node:path";
const check = process.argv.includes("--check");
const walk = (d, o = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name === "node_modules" || e.name === ".next") continue; walk(p, o); } else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) o.push(p); } return o; };
let bad = 0;
for (const f of walk("src")) {
  const s = fs.readFileSync(f, "utf8");
  if (!/^\s*["']use (client|server)["'];?\s*$/m.test(s)) continue;
  const lines = s.split(/\r?\n/);
  // find directive line index
  const idx = lines.findIndex((l) => /^\s*["']use (client|server)["'];?\s*$/.test(l));
  // first non-blank, non-comment line index
  let first = 0;
  let inBlock = false;
  for (; first < lines.length; first++) {
    const t = lines[first].trim();
    if (inBlock) { if (t.includes("*/")) inBlock = false; continue; }
    if (t === "" || t.startsWith("//")) continue;
    if (t.startsWith("/*")) { if (!t.includes("*/")) inBlock = true; continue; }
    break;
  }
  if (idx === first) continue;
  // directive found after other code at top level (only flag when preceded by import/export/code)
  const before = lines.slice(first, idx).join("\n");
  if (!/\bimport\b|\bexport\b|\bconst\b|\bfunction\b/.test(before)) continue;
  bad++;
  console.log((check ? "MISPLACED " : "fixed ") + f);
  if (!check) {
    const eol = s.includes("\r\n") ? "\r\n" : "\n";
    const directive = lines[idx].trim();
    lines.splice(idx, 1);
    lines.unshift(directive);
    fs.writeFileSync(f, lines.join(eol));
  }
}
console.log((check ? "misplaced: " : "fixed: ") + bad);
process.exit(check && bad ? 1 : 0);
