#!/usr/bin/env node
// Rewrites single-line NextResponse.json(body, {headers:{"Cache-Control":"<policy>"}}) (optionally with status first)
// to privateJson / noStoreJson / strictPrivateJson, then replaces any remaining policy string literal with CACHE.*.
//   node scripts/codemod/use-response-helpers.cjs [--dry]
const { execSync } = require("child_process");
const fs = require("fs");

const dry = process.argv.includes("--dry");
const POLICIES = [
  { text: "private, no-store, max-age=0", helper: "strictPrivateJson", konst: "PRIVATE_STRICT" },
  { text: "private, no-store", helper: "privateJson", konst: "PRIVATE" },
  { text: "no-store", helper: "noStoreJson", konst: "NONE" },
];
const files = execSync("git ls-files src", { encoding: "utf8" })
  .split("\n")
  .filter((f) => /\.(ts|tsx)$/.test(f) && f !== "src/security/responses.ts");

let changed = 0;
let helperCalls = 0;
let constants = 0;
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.includes("Cache-Control") && !raw.includes("no-store")) continue;
  const crlf = raw.includes("\r\n");
  let text = crlf ? raw.split("\r\n").join("\n") : raw;
  const used = new Set();
  let usesConst = false;

  const lines = text.split("\n").map((line) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return line;
    let l = line;
    for (const p of POLICIES) {
      const policy = p.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const cc = `"Cache-Control"\\s*:\\s*"${policy}"`;
      const onlyHeaders = new RegExp(`NextResponse\\.json\\(((?:(?!NextResponse\\.json\\().)+?),\\s*\\{\\s*headers\\s*:\\s*\\{\\s*${cc}\\s*,?\\s*\\}\\s*,?\\s*\\}\\s*\\)`, "g");
      l = l.replace(onlyHeaders, (m, body) => {
        used.add(p.helper);
        helperCalls++;
        return `${p.helper}(${body})`;
      });
      const withStatus = new RegExp(`NextResponse\\.json\\(((?:(?!NextResponse\\.json\\().)+?),\\s*\\{\\s*status\\s*:\\s*(\\d{3})\\s*,\\s*headers\\s*:\\s*\\{\\s*${cc}\\s*,?\\s*\\}\\s*,?\\s*\\}\\s*\\)`, "g");
      l = l.replace(withStatus, (m, body, status) => {
        used.add(p.helper);
        helperCalls++;
        return `${p.helper}(${body}, { status: ${status} })`;
      });
    }
    return l;
  });
  text = lines.join("\n");

  // Remaining header-object literals: use the constant.
  text = text
    .split("\n")
    .map((line) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return line;
      let l = line;
      for (const p of POLICIES) {
        const re = new RegExp(`("Cache-Control"\\s*:\\s*)"${p.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "g");
        l = l.replace(re, (m, key) => {
          usesConst = true;
          constants++;
          return `${key}CACHE.${p.konst}`;
        });
      }
      return l;
    })
    .join("\n");

  if (used.size === 0 && !usesConst) continue;

  // imports
  const names = [...used];
  if (usesConst) names.push("CACHE");
  const importLine = `import { ${names.sort().join(", ")} } from "@/security/responses";`;
  const imports = [...text.matchAll(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?\s*$|^import\s+["'][^"']+["'];?\s*$/gm)];
  if (imports.length) {
    const last = imports[imports.length - 1];
    const at = last.index + last[0].length;
    text = text.slice(0, at) + "\n" + importLine + text.slice(at);
  } else if (/^["']use (client|server)["'];?\s*\n/.test(text)) {
    text = text.replace(/^(["']use (?:client|server)["'];?\s*\n)/, "$1" + importLine + "\n");
  } else {
    text = importLine + "\n" + text;
  }

  // Drop NextResponse from next/server when nothing else uses it.
  const body = text.replace(/^import[^\n]*$/gm, "");
  if (!/\bNextResponse\b/.test(body)) {
    text = text.replace(/^import \{ NextResponse \} from "next\/server";\n/m, "");
    text = text.replace(/^import \{([^}]*)\} from "next\/server";/m, (whole, list) => {
      const kept = list.split(",").map((s) => s.trim()).filter((s) => s && s !== "NextResponse");
      return kept.length ? `import { ${kept.join(", ")} } from "next/server";` : "";
    });
  }

  changed++;
  if (!dry) fs.writeFileSync(file, crlf ? text.split("\n").join("\r\n") : text);
}
console.log(`${dry ? "would change" : "changed"} ${changed} files, ${helperCalls} helper calls, ${constants} constants`);
