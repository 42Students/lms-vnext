#!/usr/bin/env node
// Replaces inline rateLimit/timeoutMs literals with RATE_LIMITS.* / TIMEOUT_MS.*  (node scripts/codemod/use-limits.cjs [--dry])
const { execSync } = require("child_process");
const fs = require("fs");
const dry = process.argv.includes("--dry");
const T = { 5000: "SHORT", 10000: "QUICK", 12000: "REQUEST", 15000: "STANDARD", 20000: "EXTENDED", 25000: "LONG", 30000: "SLOW", 35000: "BATCH", 40000: "VERY_SLOW", 120000: "UPLOAD" };
const files = execSync("git ls-files src", { encoding: "utf8" }).split("\n").filter((f) => /\.(ts|tsx)$/.test(f) && f !== "src/security/limits.ts");
let changed = 0, n = 0;
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  if (!/rateLimit: ?\{|timeoutMs ?[:=] ?[0-9_]+/.test(raw)) continue;
  const crlf = raw.includes("\r\n");
  let text = crlf ? raw.split("\r\n").join("\n") : raw;
  const used = new Set();
  text = text.split("\n").map((line) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return line;
    let l = line.replace(/rateLimit: ?\{ ?limit: ?3000, ?windowMs: ?60_000 ?\}/g, () => { used.add("RATE_LIMITS"); n++; return "rateLimit: RATE_LIMITS.BULK"; });
    l = l.replace(/rateLimit: ?\{ ?limit: ?60, ?windowMs: ?60_000 ?\}/g, () => { used.add("RATE_LIMITS"); n++; return "rateLimit: RATE_LIMITS.STRICT"; });
    l = l.replace(/(timeoutMs ?[:=] ?)([0-9_]+)(?![0-9_.])/g, (m, pre, num) => {
      const name = T[Number(num.replace(/_/g, ""))];
      if (!name) return m;
      used.add("TIMEOUT_MS"); n++;
      return pre + "TIMEOUT_MS." + name;
    });
    return l;
  }).join("\n");
  if (!used.size) continue;
  const imp = `import { ${[...used].sort().join(", ")} } from "@/security/limits";`;
  const imports = [...text.matchAll(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?\s*$|^import\s+["'][^"']+["'];?\s*$/gm)];
  if (imports.length) { const last = imports[imports.length - 1]; const at = last.index + last[0].length; text = text.slice(0, at) + "\n" + imp + text.slice(at); }
  else if (/^["']use (client|server)["'];?\s*\n/.test(text)) text = text.replace(/^(["']use (?:client|server)["'];?\s*\n)/, "$1" + imp + "\n");
  else text = imp + "\n" + text;
  changed++;
  if (!dry) fs.writeFileSync(file, crlf ? text.split("\n").join("\r\n") : text);
}
console.log(`${dry ? "would change" : "changed"} ${changed} files, ${n} replacements`);
