#!/usr/bin/env node
// Rewrites direct `process.env.NAME` / `process.env["NAME"]` reads to the central `env.NAME` (src/config/env.ts), and a bare
// `process.env` passed around as an object to `rawEnv()`. Behaviour is identical: both read the live process environment.
//
//   node scripts/codemod/use-central-env.cjs            rewrite in place and print a summary
//   node scripts/codemod/use-central-env.cjs --dry      only report what would change
//
// Left alone on purpose: NODE_ENV and NEXT_* (the bundler replaces only a literal process.env.X), client components
// ("use client"), the edge proxy, src/config itself, comment lines, and `typeof process.env`.
const { execSync } = require("child_process");
const fs = require("fs");

const dry = process.argv.includes("--dry");
const known = new Set(
  [...fs.readFileSync("src/config/env-names.ts", "utf8").matchAll(/^\s{2}"([A-Z0-9_]+)",$/gm)].map((m) => m[1]),
);
const files = execSync("git ls-files src", { encoding: "utf8" }).split("\n").filter((f) => /\.(ts|tsx)$/.test(f));

const PROP = /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[\s*["']([A-Z][A-Z0-9_]*)["']\s*\])/g;
const WHOLE = /(?<![.\w$])process\.env(?![.\w$\[])/g;
const isCommentLine = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);

let changedFiles = 0;
let propReads = 0;
let wholeUses = 0;
const skipped = [];

for (const file of files) {
  if (file.startsWith("src/config/") || file === "src/proxy.ts") continue;
  const raw = fs.readFileSync(file, "utf8");
  if (/^\s*["']use client["']/.test(raw)) {
    if (/process\.env/.test(raw)) skipped.push(file + " (client component)");
    continue;
  }
  if (!/process\.env/.test(raw)) continue;
  const crlf = raw.includes("\r\n");
  const text = crlf ? raw.split("\r\n").join("\n") : raw;

  // An identifier named `env` already in scope forces an alias.
  const conflict = /(?<![.\w$"'`])env(?![\w$"'`:])/.test(text.replace(/^\s*(\/\/|\*|\/\*).*$/gm, ""));
  const envName = conflict ? "appEnv" : "env";

  let props = 0;
  let wholes = 0;
  const out = text.split("\n").map((line) => {
    if (isCommentLine(line)) return line;
    let next = line.replace(PROP, (match, a, b) => {
      const name = a || b;
      if (!known.has(name)) return match; // NODE_ENV, NEXT_*: keep the literal
      props += 1;
      return `${envName}.${name}`;
    });
    if (!/typeof\s+process\.env/.test(next)) {
      next = next.replace(WHOLE, () => {
        wholes += 1;
        return "rawEnv()";
      });
    }
    return next;
  });
  if (props === 0 && wholes === 0) continue;

  let result = out.join("\n");
  const imports = [];
  if (props > 0) imports.push(conflict ? "env as appEnv" : "env");
  if (wholes > 0) imports.push("rawEnv");
  const importLine = `import { ${imports.join(", ")} } from "@/config/env";`;
  // Insert after the last import statement at the top level (or after leading directives/comments when there is none).
  const importMatches = [...result.matchAll(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?\s*$|^import\s+["'][^"']+["'];?\s*$/gm)];
  if (importMatches.length) {
    const last = importMatches[importMatches.length - 1];
    const at = last.index + last[0].length;
    result = result.slice(0, at) + "\n" + importLine + result.slice(at);
  } else {
    const directive = result.match(/^(?:\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*)\s*)*(?:["']use [a-z-]+["'];?\s*)?/);
    const at = directive ? directive[0].length : 0;
    result = result.slice(0, at) + importLine + "\n" + result.slice(at);
  }

  changedFiles += 1;
  propReads += props;
  wholeUses += wholes;
  if (!dry) fs.writeFileSync(file, crlf ? result.split("\n").join("\r\n") : result);
}

console.log(`${dry ? "would change" : "changed"} ${changedFiles} files: ${propReads} property reads, ${wholeUses} whole-object uses`);
if (skipped.length) console.log("left alone:\n  " + skipped.join("\n  "));
