#!/usr/bin/env node
// Replaces role-name string literals with ROLE.X in the unambiguous value positions only:
//   hasMembershipRole(ctx, "X")   x === "X"   "X" === x   .includes("X")   case "X":
// Type positions, object keys, SQL and data tables are left alone. Usage: node ... [--dry] [files...]
const { execSync } = require("child_process");
const fs = require("fs");
const dry = process.argv.includes("--dry");
const given = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const R = "COLLEGE_ADMIN|FACULTY|LEARNER|TPO|MENTOR|SUPER_ADMIN";
const SKIP = (f) => f.startsWith("src/db/") || f === "src/modules/identity/constants.ts" || f === "src/modules/identity/roles.ts";
const files = (given.length ? given : execSync("git ls-files src", { encoding: "utf8" }).split("\n")).filter((f) => /\.(ts|tsx)$/.test(f) && !SKIP(f));
const rules = [
  [new RegExp(String.raw`(hasMembershipRole\([^()"']*?,\s*)"(${R})"`, "g"), "$1ROLE.$2"],
  [new RegExp(String.raw`(===|!==)(\s*)"(${R})"`, "g"), "$1$2ROLE.$3"],
  [new RegExp(String.raw`"(${R})"(\s*)(===|!==)`, "g"), "ROLE.$1$2$3"],
  [new RegExp(String.raw`(\.includes\()"(${R})"\)`, "g"), "$1ROLE.$2)"],
  [new RegExp(String.raw`(\bcase\s+)"(${R})":`, "g"), "$1ROLE.$2:"],
];
let changed = 0;
let total = 0;
for (const f of files) {
  const raw = fs.readFileSync(f, "utf8");
  if (!new RegExp(`"(${R})"`).test(raw)) continue;
  const crlf = raw.includes("\r\n");
  const text = crlf ? raw.split("\r\n").join("\n") : raw;
  let n = 0;
  const out = text.split("\n").map((line) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return line;
    let l = line;
    for (const [re, rep] of rules) {
      l = l.replace(re, (...a) => {
        n++;
        return rep.replace(/\$(\d)/g, (_, i) => a[+i]);
      });
    }
    return l;
  });
  if (!n) continue;
  let result = out.join("\n");
  if (!process.argv.includes("--no-import") && !/import\s*\{[^}]*\bROLE\b[^}]*\}\s*from\s*["']@\/modules\/identity\/roles["']/.test(result)) {
    const imports = [...result.matchAll(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?\s*$|^import\s+["'][^"']+["'];?\s*$/gm)];
    const line = 'import { ROLE } from "@/modules/identity/roles";';
    if (imports.length) {
      const last = imports[imports.length - 1];
      const at = last.index + last[0].length;
      result = result.slice(0, at) + "\n" + line + result.slice(at);
    } else if (/^["']use (client|server)["'];?\s*\n/.test(result)) {
      result = result.replace(/^(["']use (?:client|server)["'];?\s*\n)/, "$1" + line + "\n");
    } else {
      result = line + "\n" + result;
    }
  }
  changed++;
  total += n;
  if (!dry) fs.writeFileSync(f, crlf ? result.split("\n").join("\r\n") : result);
}
console.log(`${dry ? "would change" : "changed"} ${changed} files, ${total} replacements`);
