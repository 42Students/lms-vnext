// Replaces `permission: "service-enforced"` with the single permission the route's call tree already requires,
// using docs/security/permission-candidates.json. Conservative, per handler:
//   - only routes with exactly one candidate;
//   - mutating handlers (POST/PUT/PATCH/DELETE) take the candidate;
//   - GET handlers take it only when it is a ".read" permission and the route lists no learner/student/faculty
//     style role (a read route that several roles share must not be narrowed by a guess).
//   node scripts/codemod-permission-names.cjs [--apply]
const fs = require("fs");
const APPLY = process.argv.includes("--apply");
const cand = require("../docs/security/permission-candidates.json").routes;
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let files = 0, replaced = 0, skippedGet = 0;
const used = {};
for (const [file, r] of Object.entries(cand)) {
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, "utf8");
  if (!/permission:\s*"service-enforced"/.test(src)) continue;
  const names = r.permissions || [];
  if (names.length !== 1) continue;
  const name = names[0];
  const roles = (r.roles || []).filter((x) => !x.includes(":"));
  const broadRead = roles.some((x) => /LEARNER|STUDENT|FACULTY|MENTOR|RECRUITER|HR|TPO/.test(x));
  let out = src, changed = false;
  const re = /export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=\s*route\(/g;
  const starts = [...src.matchAll(re)].map((m) => ({ method: m[1], at: m.index }));
  for (let i = starts.length - 1; i >= 0; i--) {
    const { method, at } = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1].at : src.length;
    const seg = out.slice(at, end);
    const m = /permission:\s*"service-enforced"/.exec(seg);
    if (!m) continue;
    const okGet = method === "GET" && name.endsWith(".read") && !broadRead;
    if (!MUTATING.has(method) && !okGet) { skippedGet++; continue; }
    out = out.slice(0, at) + seg.replace(/permission:\s*"service-enforced"/, `permission: "${name}"`) + out.slice(end);
    replaced++; changed = true;
    used[name] = (used[name] || 0) + 1;
  }
  if (changed) { files++; if (APPLY) fs.writeFileSync(file, out); }
}
console.log(APPLY ? "APPLIED" : "DRY", { files, replaced, skippedGet });
console.log(JSON.stringify(used));
