// Parses every src/**/*.ts(x) with Next's own SWC (the parser the dev server and build use), which is stricter than the TypeScript
// parser used by syntax-check.mjs. Prints "path: message" per failing file and a summary line.
// usage: node scripts/audit/swc-syntax-check.cjs [root=src]
const fs = require("fs");
const path = require("path");
const swc = require("next/dist/build/swc");
const { parse } = swc;
const root = path.resolve(process.argv[2] || "src");
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== ".next") walk(p); }
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
})(root);
(async () => {
  await swc.loadBindings();
  let bad = 0;
  for (const f of files) {
    const code = fs.readFileSync(f, "utf8");
    try {
      await parse(code, { isModule: "unknown", filename: f, parser: { syntax: "typescript", tsx: f.endsWith(".tsx") } });
    } catch (e) {
      bad++;
      const msg = String(e && e.message || e).split("\n").filter((l) => l.trim()).slice(0, 2).join(" | ").slice(0, 200);
      console.log(path.relative(process.cwd(), f).replace(/\\/g, "/") + ": " + msg);
    }
  }
  console.log(`checked ${files.length} files, ${bad} with SWC syntax errors`);
})();
