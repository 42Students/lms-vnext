// Master registry of every UI surface a user can see: pages, route states, overlays (modals, drawers, sheets,
// confirm dialogs), toasts, menus/popovers/tooltips, tabs, forms, tables, and outbound messages (email, SMS, Telegram, exports).
// Usage: node scripts/audit/build-ui-surface-registry.mjs
// Writes docs/audit/ui-surfaces/UI-SURFACES.md (human) and docs/audit/ui-surfaces/ui-surfaces.json (machine).
// Regenerate after every merge; the JSON is the list to drive any future pass (scrolls, motion, copy, a11y, etc.).
import fs from "node:fs";
import path from "node:path";

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      walk(p, out);
    } else out.push(p);
  }
  return out;
};
const norm = (p) => p.split(path.sep).join("/");
const read = (p) => fs.readFileSync(p, "utf8");
const area = (route) => route.split("/")[1] || "(root)";

const appFiles = walk("src/app").map(norm);
const compFiles = walk("src/components").map(norm).filter((f) => f.endsWith(".tsx"));
const moduleFiles = walk("src/modules").map(norm).filter((f) => /\.(ts|tsx)$/.test(f));
const testFiles = walk("tests").map(norm);
const uxTestText = testFiles.filter((f) => /ux/i.test(path.basename(f))).map(read).join("\n");
const noteNames = fs.existsSync("docs/audit/ux") ? fs.readdirSync("docs/audit/ux") : [];
const noteText = noteNames.map((n) => read(path.join("docs/audit/ux", n)).toLowerCase()).join("\n");

const routeOf = (f) =>
  "/" + f.replace(/^src\/app\//, "").replace(/\/?page\.tsx$/, "").split("/").filter((s) => !/^\(.*\)$/.test(s)).join("/");

const surfaces = [];
let seq = {};
const add = (kind, rec) => {
  seq[kind] = (seq[kind] || 0) + 1;
  surfaces.push({ id: `${kind}-${String(seq[kind]).padStart(4, "0")}`, kind, ...rec });
};

// Pages and route states
for (const f of appFiles.filter((f) => /\/page\.tsx$/.test(f)).sort()) {
  const src = read(f);
  const route = routeOf(f);
  const dir = path.posix.dirname(f);
  add("PAGE", {
    route,
    area: area(route),
    file: f,
    dynamic: /\[/.test(route),
    hasLoading: appFiles.some((x) => x === dir + "/loading.tsx"),
    hasError: appFiles.some((x) => x === dir + "/error.tsx"),
    usesDataTable: /<DataTable\b/.test(src),
    forms: (src.match(/<form\b/g) || []).length,
    uxTest: uxTestText.includes(f) || uxTestText.includes(route),
    uxNote: noteText.includes(route.toLowerCase()),
  });
}
for (const f of appFiles.filter((f) => /\/(loading|error|not-found|global-error)\.tsx$/.test(f)).sort()) {
  add("ROUTE-STATE", { file: f, state: path.posix.basename(f, ".tsx"), area: area(routeOf(path.posix.dirname(f) + "/page.tsx")) });
}

// Overlays and other interactive surfaces inside components
const OVERLAY = [
  ["dialog", /<Dialog\b/], ["drawer", /<Drawer\b/], ["sheet", /<BottomSheet\b/], ["confirm", /<ConfirmDialog\b|useConfirmFlow|use-confirm-flow/],
  ["native-dialog", /<dialog\b|showModal\(/], ["aria-dialog", /role=["'](alert)?dialog["']/],
];
const OTHER = [
  ["toast", /showToast\(|useToast\(/], ["tooltip", /<Tooltip\b|<InfoPopover\b/], ["menu", /role=["']menu["']|<DropdownMenu\b|<Menu\b/],
  ["popover", /<Popover\b|popover=/], ["tabs", /<Tabs\b/], ["filter-bar", /<FilterBar\b/], ["file-upload", /<FileUpload\b/],
  ["table", /<DataTable\b|<table\b/], ["form", /<form\b/], ["disclosure", /<details\b/],
];
for (const f of compFiles.sort()) {
  if (/components\/ui\//.test(f)) continue;
  const src = read(f);
  const kinds = [];
  for (const [k, re] of [...OVERLAY, ...OTHER]) if (re.test(src)) kinds.push(k);
  if (!kinds.length) continue;
  const base = path.posix.basename(f, ".tsx");
  const overlayKinds = kinds.filter((k) => OVERLAY.some(([n]) => n === k));
  add(overlayKinds.length ? "OVERLAY" : "WIDGET", {
    file: f,
    component: base,
    area: f.split("/")[2],
    kinds,
    titles: [...src.matchAll(/(?:title|aria-label)=\{?["'`]([^"'`{}]{3,80})["'`]/g)].map((m) => m[1]).slice(0, 4),
    uxTest: uxTestText.includes(base) || uxTestText.includes(f),
    uxNote: noteText.includes(base.toLowerCase()),
  });
}

// Shared kit
for (const f of compFiles.filter((f) => /components\/ui\//.test(f)).sort()) {
  add("KIT", { file: f, component: path.posix.basename(f, ".tsx") });
}

// Outbound messages: email, SMS, Telegram, notifications, exports
for (const f of moduleFiles.sort()) {
  const base = path.posix.basename(f);
  const src = read(f);
  let channel = null;
  if (/(email|mail).*template|template.*(email|mail)|mailer|email-copy/i.test(base)) channel = "email";
  else if (/sms/i.test(base) && /template|copy|message/i.test(base)) channel = "sms";
  else if (/telegram/i.test(base)) channel = "telegram";
  else if (/notification.*(copy|template|message)/i.test(base)) channel = "notification";
  else if (/export.*(model|service|csv)|csv/i.test(base) && /text\/csv|csv/i.test(src)) channel = "export";
  if (channel) add("MESSAGE", { file: f, channel });
}

const counts = Object.fromEntries(Object.entries(seq));
fs.mkdirSync("docs/audit/ui-surfaces", { recursive: true });
fs.writeFileSync("docs/audit/ui-surfaces/ui-surfaces.json", JSON.stringify({ generatedBy: "scripts/audit/build-ui-surface-registry.mjs", counts, surfaces }, null, 1));

let md = "# UI surface registry (generated)\n\nEvery thing a user can see or interact with, by id. Source of truth for any future pass (scrolls, motion, copy, accessibility, mobile, theming). Machine copy: `ui-surfaces.json`. Regenerate: `node scripts/audit/build-ui-surface-registry.mjs`.\n\n## Counts\n\n| Kind | Count |\n|---|---|\n";
for (const [k, v] of Object.entries(counts)) md += `| ${k} | ${v} |\n`;
const byArea = {};
for (const s of surfaces.filter((s) => s.kind === "PAGE")) byArea[s.area] = (byArea[s.area] || 0) + 1;
md += "\n## Pages per area\n\n| Area | Pages |\n|---|---|\n";
for (const [a, n] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) md += `| /${a} | ${n} |\n`;
md += "\n## Pages\n\n| Id | Route | Loading | Error | DataTable | Forms | UX test | UX note | File |\n|---|---|---|---|---|---|---|---|---|\n";
for (const s of surfaces.filter((s) => s.kind === "PAGE"))
  md += `| ${s.id} | ${s.route} | ${s.hasLoading ? "y" : "n"} | ${s.hasError ? "y" : "n"} | ${s.usesDataTable ? "y" : "-"} | ${s.forms || "-"} | ${s.uxTest ? "y" : "n"} | ${s.uxNote ? "y" : "n"} | ${s.file} |\n`;
md += "\n## Overlays (modals, drawers, sheets, confirms)\n\n| Id | Component | Kinds | Titles | UX test | UX note | File |\n|---|---|---|---|---|---|---|\n";
for (const s of surfaces.filter((s) => s.kind === "OVERLAY"))
  md += `| ${s.id} | ${s.component} | ${s.kinds.join(", ")} | ${s.titles.join("; ")} | ${s.uxTest ? "y" : "n"} | ${s.uxNote ? "y" : "n"} | ${s.file} |\n`;
md += "\n## Other interactive widgets (toasts, tooltips, menus, tabs, filters, uploads, tables, forms)\n\n| Id | Component | Kinds | File |\n|---|---|---|---|\n";
for (const s of surfaces.filter((s) => s.kind === "WIDGET")) md += `| ${s.id} | ${s.component} | ${s.kinds.join(", ")} | ${s.file} |\n`;
md += "\n## Route states (loading, error, not-found)\n\n| Id | State | File |\n|---|---|---|\n";
for (const s of surfaces.filter((s) => s.kind === "ROUTE-STATE")) md += `| ${s.id} | ${s.state} | ${s.file} |\n`;
md += "\n## Shared kit\n\n| Id | Component | File |\n|---|---|---|\n";
for (const s of surfaces.filter((s) => s.kind === "KIT")) md += `| ${s.id} | ${s.component} | ${s.file} |\n`;
md += "\n## Outbound messages (email, SMS, Telegram, notifications, exports)\n\n| Id | Channel | File |\n|---|---|---|\n";
for (const s of surfaces.filter((s) => s.kind === "MESSAGE")) md += `| ${s.id} | ${s.channel} | ${s.file} |\n`;
fs.writeFileSync("docs/audit/ui-surfaces/UI-SURFACES.md", md);
console.log(JSON.stringify(counts));
