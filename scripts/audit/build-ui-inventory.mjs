// Builds the per-area page inventory used by the UI/UX excellence pass.
// Usage: node scripts/audit/build-ui-inventory.mjs
import fs from "node:fs";
import path from "node:path";

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === "page.tsx") out.push(full);
  }
  return out;
}

const pages = walk("src/app")
  .map((file) => file.split(path.sep).join("/"))
  .map((file) => ({
    file,
    route:
      "/" +
      file
        .replace(/^src\/app\//, "")
        .replace(/\/page\.tsx$/, "")
        .split("/")
        .filter((segment) => !/^\(.*\)$/.test(segment))
        .join("/"),
  }));

const groups = {};
for (const page of pages) {
  const top = page.route.split("/")[1] || "(root)";
  (groups[top] ||= []).push(page);
}

fs.mkdirSync("docs/orchestrator/ui-ux", { recursive: true });
const sorted = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
for (const [area, list] of sorted) {
  const lines = [
    `# UI/UX excellence page list: /${area} (${list.length} pages)`,
    "",
    "Tick a page only after its UX note exists at docs/audit/ux/<route-with-dashes>.md and its tests pass.",
    "",
    ...list
      .sort((a, b) => a.route.localeCompare(b.route))
      .map((p) => `- [ ] \`${p.route}\` (${p.file})`),
    "",
  ];
  fs.writeFileSync(`docs/orchestrator/ui-ux/pages-${area.replace(/[^a-z0-9-]/gi, "_")}.md`, lines.join("\n"));
}
console.log(sorted.map(([area, list]) => `${area}: ${list.length}`).join("\n"));
console.log("total", pages.length);
