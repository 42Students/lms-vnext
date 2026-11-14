#!/usr/bin/env node
// Removes a local helper definition whose normalised text equals a known canonical variant and imports the shared one.
//   node scripts/codemod/dedupe-helper.cjs <name> <importFrom> <variantsFile.json> [--dry]
// variantsFile: JSON array of normalised definition strings (whitespace collapsed, spaces around punctuation removed).
const { execSync } = require("child_process");
const fs = require("fs");

const [name, importFrom, variantsFile] = process.argv.slice(2);
const dry = process.argv.includes("--dry");
const rawVariants = JSON.parse(fs.readFileSync(variantsFile, "utf8"));
const variants = new Set(rawVariants.filter((v) => !v.startsWith("re:")).map(normalise));
const variantRes = rawVariants.filter((v) => v.startsWith("re:")).map((v) => new RegExp(v.slice(3)));
const isVariant = (norm) => variants.has(norm) || variantRes.some((r) => r.test(norm));

function normalise(text) {
  return text.replace(/\s+/g, "").replace(/;$/, "");
}

function findDefinitions(text) {
  const out = [];
  const fn = new RegExp(`^(?:export )?(?:async )?function ${name}\\b`, "gm");
  const cn = new RegExp(`^(?:export )?const ${name}\\s*(?::[^=]+)?=`, "gm");
  for (const m of text.matchAll(fn)) {
    if (m[0].startsWith("export")) continue;
    let i = text.indexOf("{", text.indexOf(")", m.index));
    // skip a return type containing braces is not handled: bail when the signature contains "{" before ")"
    const sig = text.slice(m.index, i);
    if (/\{/.test(sig.slice(0, sig.indexOf(")")))) continue;
    let depth = 0;
    let j = i;
    for (; j < text.length; j++) {
      if (text[j] === "{") depth++;
      else if (text[j] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    out.push({ start: m.index, end: j + 1 });
  }
  for (const m of text.matchAll(cn)) {
    if (m[0].startsWith("export")) continue;
    // single statement ending at the first ";" at depth 0 on or after the "=".
    let depth = 0;
    let j = m.index + m[0].length;
    for (; j < text.length; j++) {
      const c = text[j];
      if ("({[".includes(c)) depth++;
      else if (")}]".includes(c)) depth--;
      else if (c === ";" && depth === 0) break;
    }
    out.push({ start: m.index, end: Math.min(j + 1, text.length) });
  }
  return out;
}

const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
const files = execSync("git ls-files src", { encoding: "utf8" }).split("\n").filter((f) => /\.(ts|tsx)$/.test(f) && f !== importFrom.replace("@/", "src/") + ".ts" && (!only || only.includes(f)));
let changed = 0;
const unmatched = [];
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.includes(name)) continue;
  const crlf = raw.includes("\r\n");
  let text = crlf ? raw.split("\r\n").join("\n") : raw;
  const defs = findDefinitions(text).sort((a, b) => b.start - a.start);
  let removed = 0;
  for (const d of defs) {
    const body = text.slice(d.start, d.end);
    if (!isVariant(normalise(body))) {
      unmatched.push(file + ": " + body.replace(/\s+/g, " ").slice(0, 110));
      continue;
    }
    let end = d.end;
    while (text[end] === "\n" && text[end + 1] === "\n") end++;
    if (text[end] === "\n") end++;
    text = text.slice(0, d.start) + text.slice(end);
    removed++;
  }
  if (!removed) continue;
  const already = !process.env.IMPORT_AS && new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["']${importFrom.replace(/[/]/g, "\\/")}["']`).test(text);
  if (!already) {
    const line = process.env.IMPORT_AS ? `import { ${process.env.IMPORT_AS} as ${name} } from "${importFrom}";` : `import { ${name} } from "${importFrom}";`;
    const imports = [...text.matchAll(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?\s*$|^import\s+["'][^"']+["'];?\s*$/gm)];
    if (imports.length) {
      const last = imports[imports.length - 1];
      const at = last.index + last[0].length;
      text = text.slice(0, at) + "\n" + line + text.slice(at);
    } else if (/^["']use (client|server)["'];?\s*\n/.test(text)) {
      text = text.replace(/^(["']use (?:client|server)["'];?\s*\n)/, "$1" + line + "\n");
    } else text = line + "\n" + text;
  }
  changed++;
  if (!dry) fs.writeFileSync(file, crlf ? text.split("\n").join("\r\n") : text);
}
console.log(`${dry ? "would change" : "changed"} ${changed} files for ${name}`);
if (unmatched.length) console.log("left alone (different definition):\n  " + unmatched.slice(0, 40).join("\n  ") + (unmatched.length > 40 ? `\n  ... ${unmatched.length - 40} more` : ""));
