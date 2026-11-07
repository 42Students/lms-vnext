const fs = require("fs");
const s = require("../docs/tracker.json").security;
const cat = fs.readFileSync("docs/security/control-catalog.md", "utf8").split(/\r?\n/);
const groups = []; const text = {};
for (const l of cat) {
  let m = l.match(/^## (SEC-\d\d) — (.*)$/); if (m) groups.push({ id: m[1], title: m[2] });
  m = l.match(/^- \*\*(SEC-\d\d-\d{3})\*\* — (.*)$/); if (m) text[m[1]] = m[2];
}
const order = { GAP_CONFIRMED: 0, IMPLEMENTED_UNVERIFIED: 1, PARTIAL_EVIDENCE: 2, UNASSESSED: 3, VERIFIED: 4 };
const tot = {};
for (const v of Object.values(s.controls)) tot[v.state] = (tot[v.state] || 0) + 1;
let o = `# MASTER SECURITY TODO (ask me: "master security todo")\n\n`;
o += `Generated 2026-11-07 from \`docs/tracker.json\` (the only status source) and \`control-catalog.md\`. Regenerate with \`node scratch/gen-master-todo.cjs\` (copy kept at \`scripts/security/gen-master-todo.cjs\`). A box is ticked only when the tracker says VERIFIED: test proof, deployed proof and an independent reviewer.\n\n`;
o += `Totals: ${Object.entries(tot).map(([k, v]) => k + " " + v).join(", ")}. Release sign-off: NOT approved.\n\n`;
o += `## Work order\n\n1. Close the route layer (done 2026-11-07): every API route on the central wrapper.\n2. Server actions gated by guardAction + guard rule (done 2026-11-07); proxy reviewed; health/ready left outside on purpose (see architecture doc).\n3. Independent audit of the central layer (\`audit-brief-2026-11-07.md\`), fix findings.\n4. Assess the unassessed controls, group by group, starting with SEC-03, 05, 06, 08 (access, tenant, RLS, API).\n5. Owner-gated: dev switches (tenant scope, shared store, RLS), credential rotation, branch protection and second code owner (SEC-18-002, SEC-18-004), pen test (SEC-24).\n\n## Summary by group\n\n| Group | Title | Controls | Verified | Assessed | Unassessed |\n|---|---|---|---|---|---|\n`;
const rows = [];
for (const g of groups) {
  const ks = Object.keys(s.controls).filter((k) => k.startsWith(g.id + "-")).sort();
  const n = (st) => ks.filter((k) => s.controls[k].state === st).length;
  rows.push(`| ${g.id} | ${g.title} | ${ks.length} | ${n("VERIFIED")} | ${ks.length - n("UNASSESSED")} | ${n("UNASSESSED")} |`);
}
o += rows.join("\n") + "\n\n## Every control, by group\n\n`[ ]` open. State in brackets. Assessed controls show the next proof needed.\n";
for (const g of groups) {
  o += `\n### ${g.id} - ${g.title}\n\n`;
  const ks = Object.keys(s.controls).filter((k) => k.startsWith(g.id + "-")).sort((a, b) => order[s.controls[a].state] - order[s.controls[b].state] || a.localeCompare(b));
  for (const k of ks) {
    const c = s.controls[k];
    o += `- [${c.state === "VERIFIED" ? "x" : " "}] **${k}** [${c.state}] ${text[k] || ""}\n`;
    if (c.nextProof) o += `  - Next proof: ${c.nextProof}\n`;
  }
}
fs.writeFileSync("docs/security/MASTER-SECURITY-TODO.md", o);
fs.copyFileSync("scratch/gen-master-todo.cjs", "scripts/security/gen-master-todo.cjs");
console.log("lines", o.split("\n").length);
