#!/usr/bin/env node
// Replaces the inline `credential: {...}` of every internalRoute() with jobCredential("<name>") from src/security/jobs.ts.
const { execSync } = require("child_process");
const fs = require("fs");
const files = require("child_process").execFileSync("git", ["grep", "-l", "internalRoute(", "--", "src/app"], { encoding: "utf8" }).split("\n").filter(Boolean);
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  let text = crlf ? raw.split("\r\n").join("\n") : raw;
  const name = /name:\s*"([^"]+)"/.exec(text)?.[1];
  if (!name) throw new Error("no name in " + file);
  const re = /credential:\s*\{[^{}]*\}/;
  if (!re.test(text)) throw new Error("no credential in " + file);
  text = text.replace(re, `credential: jobCredential("${name}")`);
  const imp = 'import { jobCredential } from "@/security/jobs";';
  const imports = [...text.matchAll(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?\s*$/gm)];
  const last = imports[imports.length - 1];
  const at = last.index + last[0].length;
  text = text.slice(0, at) + "\n" + imp + text.slice(at);
  // WORKER_HEADER / WORKER_ENV constants become dead once the credential comes from the registry.
  for (const constName of ["WORKER_HEADER", "WORKER_ENV"]) {
    const uses = text.split(constName).length - 1;
    if (uses === 1) text = text.replace(new RegExp(`^const ${constName}\\s*=\\s*"[^"]*";\\n`, "m"), "");
  }
  fs.writeFileSync(file, crlf ? text.split("\n").join("\r\n") : text);
  console.log("migrated", file);
}
