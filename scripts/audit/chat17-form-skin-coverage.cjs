#!/usr/bin/env node
/**
 * Lane chat-17, local source coverage inventory. This script is analysis only:
 * it writes no files, runs no tests and makes no network requests.
 *
 * Usage: node scripts/audit/chat17-form-skin-coverage.cjs
 *        node scripts/audit/chat17-form-skin-coverage.cjs --json
 *
 * It deliberately reports raw controls even inside shared primitives;
 * the owner must explicitly exempt legitimate implementation nodes.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "../..");
const srcDir = path.join(root, "src");
const skinPath = path.join(srcDir, "styles", "legacy-skin.css");
const globalsPath = path.join(srcDir, "app", "globals.css");
const paths = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) paths.push(absolute);
  }
}
walk(srcDir);

const rawControls = Object.fromEntries(["button", "input", "select", "textarea"].map(name => [name, []]));
const inlineHex = [];
const grid = [];
const syntaxDiagnostics = [];
for (const absolute of paths) {
  const source = fs.readFileSync(absolute, "utf8");
  const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
  if (absolute.endsWith(".tsx")) {
    const node = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const diagnostic of node.parseDiagnostics) {
      const line = node.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1;
      syntaxDiagnostics.push(`${relative}:${line}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
    }
    function visit(part) {
      if (ts.isJsxOpeningElement(part) || ts.isJsxSelfClosingElement(part)) {
        const tag = part.tagName.getText(node);
        if (Object.prototype.hasOwnProperty.call(rawControls, tag)) {
          const line = node.getLineAndCharacterOfPosition(part.getStart(node)).line + 1;
          rawControls[tag].push(`${relative}:${line}`);
        }
      }
      ts.forEachChild(part, visit);
    }
    visit(node);
  }
  if (/\.(css|tsx)$/.test(absolute)) {
    const lines = source.split(/\r?\n/);
    lines.forEach((text, index) => {
      for (const match of text.matchAll(/#[\da-fA-F]{3,8}\b/g)) {
        inlineHex.push(`${relative}:${index + 1}:${match[0]}`);
      }
      if (/(?:max-width|min-width)\s*:\s*(?:767|768|991|992)px|(?:max|min)-\[?(?:767|768|991|992)px/.test(text)) {
        grid.push(`${relative}:${index + 1}`);
      }
    });
  }
}

const skin = fs.readFileSync(skinPath, "utf8");
const globalStyles = fs.readFileSync(globalsPath, "utf8");
const imports = (globalStyles.match(/@import\s+["'][^"']*legacy-skin\.css["'];/g) || []).length;
const selectorCount = Array.from(skin.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{/g))
  .map(match => match[1].trim().replace(/\s+/g, " "))
  .filter(value => !value.startsWith("@")).length;
const report = {
  note: "Source-only inventory; browser computed styles and responsive screenshots are not verified.",
  totalSourceFiles: paths.length,
  exactRawJsxCounts: Object.fromEntries(Object.entries(rawControls).map(([name, values]) => [name, values.length])),
  rawControls,
  syntaxDiagnosticCount: syntaxDiagnostics.length,
  syntaxDiagnostics,
  hardcodedHexCount: inlineHex.length,
  hardcodedHexLocations: inlineHex,
  responsiveSourceReferences: grid,
  skin: { importedFromGlobals: imports, ruleCount: selectorCount, hasEscapeHatch: skin.includes("[data-unskin]") },
};
if (process.argv.includes("--json")) process.stdout.write(JSON.stringify(report, null, 2) + "\n");
else {
  process.stdout.write("Lane chat-17 source inventory (not browser parity)\n");
  process.stdout.write(`Total source files: ${report.totalSourceFiles}\n`);
  for (const [key, values] of Object.entries(rawControls)) {
    process.stdout.write(`Raw <${key}> nodes: ${values.length}\n`);
    for (const value of values) process.stdout.write(`  ${value}\n`);
  }
  process.stdout.write(`JSX syntax diagnostics: ${syntaxDiagnostics.length}\n`);
  for (const value of syntaxDiagnostics) process.stdout.write(`  ${value}\n`);
  process.stdout.write(`Hard-coded hex matches: ${inlineHex.length}\n`);
  for (const value of inlineHex) process.stdout.write(`  ${value}\n`);
  process.stdout.write(`Skin imports: ${imports}; scoped rules (pre-CSS parse): ${selectorCount}\n`);
}
