#!/usr/bin/env node
// Rewrites hand-built `attachment; filename="..."` header values to attachmentHeader(name) from src/security/downloads.ts.
const { execSync } = require("child_process");
const fs = require("fs");
const dry = process.argv.includes("--dry");
const files = execSync("git ls-files src", { encoding: "utf8" }).split("\n").filter((f) => /\.(ts|tsx)$/.test(f) && f !== "src/security/downloads.ts" && f !== "src/security/download-core.ts");
const forms = [
  // 'attachment; filename="static.csv"'  (single or double outer quotes)
  [/'attachment;\s*filename="([^"'`$\\]+)"'/g, (m, name) => `attachmentHeader("${name}")`],
  [/"attachment;\s*filename=([A-Za-z0-9_.\-]+)"/g, (m, name) => `attachmentHeader("${name}")`],
  // 'attachment; filename="'+expr+'"'
  [/'attachment;\s*filename="'\s*\+\s*(.+?)\s*\+\s*'"'/g, (m, expr) => `attachmentHeader(${expr})`],
  // `attachment; filename="${expr}"`  (single interpolation or literal text around it)
  [/`attachment;\s*filename="([^`"]*)"`/g, (m, inner) => {
    if (!inner.includes("${")) return `attachmentHeader("${inner}")`;
    return "attachmentHeader(`" + inner + "`)";
  }],
];
let changed = 0, n = 0;
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  if (!/attachment;\s*filename=/.test(raw)) continue;
  const crlf = raw.includes("\r\n");
  let text = crlf ? raw.split("\r\n").join("\n") : raw;
  let count = 0;
  text = text.split("\n").map((line) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return line;
    let l = line;
    for (const [re, fn] of forms) l = l.replace(re, (...a) => { count++; return fn(...a); });
    return l;
  }).join("\n");
  if (!count) continue;
  const imp = 'import { attachmentHeader } from "@/security/downloads";';
  const imports = [...text.matchAll(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?\s*$|^import\s+["'][^"']+["'];?\s*$/gm)];
  if (imports.length) { const last = imports[imports.length - 1]; const at = last.index + last[0].length; text = text.slice(0, at) + "\n" + imp + text.slice(at); }
  else if (/^["']use (client|server)["'];?\s*\n/.test(text)) text = text.replace(/^(["']use (?:client|server)["'];?\s*\n)/, "$1" + imp + "\n");
  else text = imp + "\n" + text;
  changed++; n += count;
  if (!dry) fs.writeFileSync(file, crlf ? text.split("\n").join("\r\n") : text);
}
console.log(`${dry ? "would change" : "changed"} ${changed} files, ${n} headers`);
