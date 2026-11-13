#!/usr/bin/env node
// Replaces the "Asia/Kolkata" string literal with DEFAULT_TIME_ZONE from src/config/locale.ts.
const { execSync } = require("child_process");
const fs = require("fs");
const dry = process.argv.includes("--dry");
const files = execSync("git ls-files src", { encoding: "utf8" }).split("\n").filter((f) => /\.(ts|tsx)$/.test(f) && f !== "src/config/locale.ts");
let changed = 0, total = 0;
for (const f of files) {
  const raw = fs.readFileSync(f, "utf8");
  if (!raw.includes('"Asia/Kolkata"')) continue;
  const crlf = raw.includes("\r\n");
  const text = crlf ? raw.split("\r\n").join("\n") : raw;
  let n = 0;
  const out = text.split("\n").map((line) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return line;
    return line.replace(/"Asia\/Kolkata"/g, () => { n++; return "DEFAULT_TIME_ZONE"; });
  });
  if (!n) continue;
  let result = out.join("\n");
  const imp = 'import { DEFAULT_TIME_ZONE } from "@/config/locale";';
  const imports = [...result.matchAll(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?\s*$|^import\s+["'][^"']+["'];?\s*$/gm)];
  if (imports.length) { const last = imports[imports.length - 1]; const at = last.index + last[0].length; result = result.slice(0, at) + "\n" + imp + result.slice(at); }
  else if (/^["']use (client|server)["'];?\s*\n/.test(result)) result = result.replace(/^(["']use (?:client|server)["'];?\s*\n)/, "$1" + imp + "\n");
  else result = imp + "\n" + result;
  changed++; total += n;
  if (!dry) fs.writeFileSync(f, crlf ? result.split("\n").join("\r\n") : result);
}
console.log(`${dry ? "would change" : "changed"} ${changed} files, ${total} replacements`);
