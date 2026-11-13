#!/usr/bin/env node
// Rewrites explicit `response.cookies.set(NAME, VALUE, { httpOnly: true, secure: ..., sameSite: "lax", path: "/", maxAge: X })`
// (and the `...base` form) to setAuthCookie / clearAuthCookie from src/auth/cookies.ts.
const { execSync } = require("child_process");
const fs = require("fs");
const dry = process.argv.includes("--dry");
const files = execSync("git ls-files src/app src/modules", { encoding: "utf8" }).split("\n").filter((f) => /\.ts$/.test(f));
const OPTS = String.raw`\{\s*httpOnly:\s*true,\s*secure:\s*[^,]+?,\s*sameSite:\s*"lax"(?:\s+as\s+const)?,\s*path:\s*"\/",\s*maxAge:\s*([^,}]+?),?\s*\}`;
const re = new RegExp(String.raw`(\w+)\.cookies\.set\(\s*([^,]+?),\s*((?:[^,(){}]|\([^()]*\))+?),\s*` + OPTS + String.raw`\s*,?\s*\)`, "g");
const reBase = new RegExp(String.raw`(\w+)\.cookies\.set\(\s*([^,]+?),\s*((?:[^,(){}]|\([^()]*\))+?),\s*\{\s*\.\.\.base,\s*maxAge:\s*([^,}]+?),?\s*\}\s*,?\s*\)`, "g");
let changed = 0, n = 0;
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.includes(".cookies.set(")) continue;
  const crlf = raw.includes("\r\n");
  let text = crlf ? raw.split("\r\n").join("\n") : raw;
  const used = new Set();
  const fix = (m, res, name, value, age) => {
    n++;
    if (value.trim() === '""' && age.trim() === "0") { used.add("clearAuthCookie"); return `clearAuthCookie(${res}, ${name.trim()})`; }
    used.add("setAuthCookie");
    return `setAuthCookie(${res}, ${name.trim()}, ${value.trim()}, ${age.trim()})`;
  };
  const next = text.replace(re, fix).replace(reBase, fix);
  if (next === text) continue;
  text = next;
  const imp = `import { ${[...used].sort().join(", ")} } from "@/auth/cookies";`;
  const imports = [...text.matchAll(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?\s*$|^import\s+["'][^"']+["'];?\s*$/gm)];
  if (imports.length) { const last = imports[imports.length - 1]; const at = last.index + last[0].length; text = text.slice(0, at) + "\n" + imp + text.slice(at); }
  else text = imp + "\n" + text;
  changed++;
  if (!dry) fs.writeFileSync(file, crlf ? text.split("\n").join("\r\n") : text);
}
console.log(`${dry ? "would change" : "changed"} ${changed} files, ${n} cookie writes`);
