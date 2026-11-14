#!/usr/bin/env node
// Replaces inline z.string().uuid() and z.uuid() (no custom message) with zUuid from src/lib/schema-primitives.ts.
const { execSync } = require("child_process");
const fs = require("fs");
const dry = process.argv.includes("--dry");
const files = execSync("git ls-files src", { encoding: "utf8" }).split("\n").filter((f) => /\.(ts|tsx)$/.test(f) && f !== "src/lib/schema-primitives.ts");
let changed = 0, n = 0;
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  if (!/z\.string\(\)\.uuid\(\)|z\.uuid\(\)/.test(raw)) continue;
  const crlf = raw.includes("\r\n");
  let text = crlf ? raw.split("\r\n").join("\n") : raw;
  let count = 0;
  text = text.split("\n").map((line) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return line;
    return line.replace(/z\.string\(\)\.uuid\(\)|(?<![\w.])z\.uuid\(\)/g, () => { count++; return "zUuid"; });
  }).join("\n");
  if (!count) continue;
  const imp = 'import { zUuid } from "@/lib/schema-primitives";';
  const imports = [...text.matchAll(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?\s*$|^import\s+["'][^"']+["'];?\s*$/gm)];
  if (imports.length) { const last = imports[imports.length - 1]; const at = last.index + last[0].length; text = text.slice(0, at) + "\n" + imp + text.slice(at); }
  else if (/^["']use (client|server)["'];?\s*\n/.test(text)) text = text.replace(/^(["']use (?:client|server)["'];?\s*\n)/, "$1" + imp + "\n");
  else text = imp + "\n" + text;
  changed++; n += count;
  if (!dry) fs.writeFileSync(file, crlf ? text.split("\n").join("\r\n") : text);
}
console.log(`${dry ? "would change" : "changed"} ${changed} files, ${n} schemas`);
