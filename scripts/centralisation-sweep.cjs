const fs = require("fs"), path = require("path");
const roots = ["src", "tests", "scripts", "db", "drizzle", "migrations", "sql"].filter((d) => fs.existsSync(d));
const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (["node_modules", ".next", "graphify-out", "legacy-source"].includes(e.name)) continue;
    const p = d + "/" + e.name;
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|sql|cjs|mjs|css)$/.test(e.name)) files.push(p);
  }
}
roots.forEach(walk);
const src = (f) => f.startsWith("src/");
const tsx = (f) => f.endsWith(".tsx");
const D = {
  "z.object inline in route files": [/z\.object\(/g, (f) => /^src\/app\/api\/.*route\.ts$/.test(f)],
  "zod .email() inline": [/\.email\(/g, src],
  "zod .min/.max numeric lengths in api+modules": [/\.(min|max)\(\d+/g, (f) => /^src\/(app\/api|modules)/.test(f)],
  "phone +91 literals": [/\+91/g, src],
  "sql`` in modules": [/\bsql`/g, (f) => f.startsWith("src/modules")],
  "sql`` in components/pages": [/\bsql`/g, (f) => /^src\/(components|app\/\(authenticated\))/.test(f)],
  "db/tx select|insert|update|delete in modules": [/\b(db|tx)\.(select|insert|update|delete)\(/g, (f) => f.startsWith("src/modules")],
  "hex colours in tsx": [/#[0-9a-fA-F]{6}\b/g, (f) => tsx(f) && src(f)],
  "tailwind arbitrary values": [/\b(?:w|h|p|m|px|py|mt|mb|ml|mr|gap|text|bg|border|rounded|min-w|max-w|min-h|max-h)-\[[^\]]+\]/g, tsx],
  "inline style={{": [/style=\{\{/g, tsx],
  "raw palette colour classes": [/\b(?:bg|text|border|ring)-(?:red|green|blue|amber|yellow|orange|emerald|rose|sky|indigo|purple|slate|gray|zinc)-\d{2,3}\b/g, tsx],
  "fetch( in components": [/\bfetch\(/g, tsx],
  "setError/setLoading/setPending/setBusy": [/\bset(Error|Loading|Pending|Busy|Saving|Submitting)\(/g, tsx],
  "window.confirm/alert": [/window\.(confirm|alert)\(|[^.\w]confirm\(|[^.\w]alert\(/g, tsx],
  "local/sessionStorage access": [/(local|session)Storage\.(get|set|remove)Item\(/g, src],
  "x- header literals": [/["']x-[a-z-]+["']/gi, src],
  "cookie name literals": [/cookies(\(\))?\.(get|set|delete)\(["']/g, src],
  "new Date( in components": [/new Date\(/g, tsx],
  "toLocale*String": [/\.toLocale(Date|Time)?String\(/g, src],
  "toFixed / Intl.NumberFormat / rupee": [/\.toFixed\(|Intl\.NumberFormat|₹|"INR"/g, src],
  "magic byte sizes": [/\b\d+\s*\*\s*1024\s*\*\s*1024|\b1024\s*\*\s*1024/g, src],
  "setTimeout/Interval ms literals": [/set(Timeout|Interval)\([^,]+,\s*\d{3,}/g, src],
  "role array literals": [/\[\s*"(?:COLLEGE_ADMIN|SUPER_ADMIN|LEARNER|FACULTY|TPO|MENTOR|RECRUITER)"(?:\s*,\s*"[A-Z_]+")*\s*\]/g, src],
  "role === literal in components": [/role\s*===?\s*["'][A-Z_]+["']/g, tsx],
  "href literal in components": [/href=["']\/[a-z]/g, tsx],
  "router.push literal": [/router\.(push|replace)\(["'`]\//g, tsx],
  "redirect( literal": [/\bredirect\(["'`]\//g, src],
  "message setters with literal copy": [/(toast|notify|setMessage|setNotice|setError|setStatus)\(\s*["'`][A-Z]/g, tsx],
  "JSX sentences >40 chars": [/>[A-Z][^<>{}]{40,}</g, tsx],
  "placeholder= literal": [/placeholder=["']/g, tsx],
  "aria-label literal": [/aria-label=["']/g, tsx],
  "html strings in modules (email bodies)": [/<html|<p>|<a href=/g, (f) => f.startsWith("src/modules")],
  "audit eventType/action literals in modules": [/eventType:\s*["'][a-z_.]+["']|action:\s*["'][A-Z_]+["']/g, (f) => f.startsWith("src/modules")],
  "SQL check ... in (...) lists": [/check\s*\([^)]*\bin\s*\(/gi, (f) => f.endsWith(".sql")],
  "SQL create table": [/create table/gi, (f) => f.endsWith(".sql")],
  "SQL updated_at": [/updated_at/g, (f) => f.endsWith(".sql")],
  "SQL create policy": [/create policy/gi, (f) => f.endsWith(".sql")],
  "SQL create trigger": [/create trigger/gi, (f) => f.endsWith(".sql")],
  "use server": [/["']use server["']/g, src],
  "page title literal in page/layout": [/title:\s*["'`][A-Z]/g, (f) => /(page|layout)\.tsx$/.test(f)],
  "COUNT page.tsx": ["file", (f) => /page\.tsx$/.test(f)],
  "COUNT loading.tsx": ["file", (f) => /loading\.tsx$/.test(f)],
  "COUNT error.tsx": ["file", (f) => /error\.tsx$/.test(f)],
  "COUNT route.ts": ["file", (f) => /route\.ts$/.test(f)],
  "COUNT components .tsx": ["file", (f) => f.startsWith("src/components/") && tsx(f)],
  "COUNT unit test files": ["file", (f) => /^tests\/unit\/.*\.test\.tsx?$/.test(f)],
  "unit tests reading source text": [/readFileSync\(/g, (f) => /^tests\/unit\/.*\.test\.tsx?$/.test(f)],
  "test inline collegeId uuid literals": [/collegeId:\s*["'`][0-9a-f-]{8,}/g, (f) => /\.test\.tsx?$/.test(f)],
  "vi.mock of @/db": [/vi\.mock\(["']@\/db/g, (f) => /\.test\.tsx?$/.test(f)],
};
const rows = [];
for (const [label, [re, flt]] of Object.entries(D)) {
  let total = 0, fc = 0;
  const per = [];
  for (const f of files) {
    if (!flt(f)) continue;
    if (re === "file") { total++; fc++; continue; }
    const t = fs.readFileSync(f, "utf8");
    const m = t.match(re);
    if (m) { total += m.length; fc++; per.push([f, m.length]); }
  }
  per.sort((a, b) => b[1] - a[1]);
  rows.push([label, total, fc, per.slice(0, 2).map(([f, n]) => n + " " + f.replace(/^src\//, "")).join(" | ")]);
}
for (const [l, t, fc, top] of rows) console.log(String(t).padStart(7), String(fc).padStart(5), l.padEnd(46), top.slice(0, 120));
