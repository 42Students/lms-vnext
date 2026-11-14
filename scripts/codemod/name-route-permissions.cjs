// Names the real permission on routes whose service layer unconditionally checks exactly one permission.
// Input: scratch/route-permission-analysis.json (node scripts/analyze-route-permissions.cjs).
// Usage: PERMS="academics.manage,college.manage" [LIMIT=40] [SKIP=n] node scripts/codemod/name-route-permissions.cjs
// With no PERMS it lists the candidate counts and changes nothing.
const fs = require("fs");
const analysis = require(process.cwd() + "/scratch/route-permission-analysis.json");

const wanted = (process.env.PERMS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const limit = Number(process.env.LIMIT ?? 1000);
const skip = Number(process.env.SKIP ?? 0);

const candidates = [];
for (const r of analysis) {
  if (r.detail.length === 0 || r.methods.length !== 1) continue;
  const sets = r.detail.map((d) => d.checks.join("|"));
  if (sets.every((s) => s !== "" && s === sets[0] && !s.includes("|"))) candidates.push({ route: r.route, permission: sets[0] });
}
if (wanted.length === 0) {
  const counts = {};
  for (const c of candidates) counts[c.permission] = (counts[c.permission] ?? 0) + 1;
  console.log(counts);
  process.exit(0);
}
let changed = 0;
const done = [];
for (const c of candidates.filter((x) => wanted.includes(x.permission)).slice(skip, skip + limit)) {
  const raw = fs.readFileSync(c.route, "utf8");
  if (!/auth: "user", permission: "service-enforced"/.test(raw)) continue; // only signed-in routes can hold a permission
  const next = raw.replace('permission: "service-enforced"', `permission: "${c.permission}"`);
  if (next === raw) continue;
  fs.writeFileSync(c.route, next);
  changed++;
  done.push(c.route);
}
fs.writeFileSync("scratch/named-routes.txt", done.join("\n") + "\n");
console.log("named", changed, "routes");
