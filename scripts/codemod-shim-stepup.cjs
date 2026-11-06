// Adds step-up authentication (sign-in within 15 minutes) to the sensitive secured() handlers, per handler:
//   - state-changing handlers where the shim already enforces origin centrally (csrf: "enforce"), so the central
//     check changes nothing a caller can see except that a stale sign-in is refused before any work;
//   - GET handlers that are downloads (Content-Disposition attachment / CSV).
// on paths the guard calls sensitive (SENSITIVE_PATH in scripts/security-central-rules.mjs). Owner decision 2026-11-06.
//   node scripts/codemod-shim-stepup.cjs [--apply]
const fs = require("fs");
const cp = require("child_process");

const APPLY = process.argv.includes("--apply");

// Staff and administrator surfaces first. Self-service exports (a learner's or mentor's own data) and recruiter
// downloads are decided individually, not by pattern.
const STAFF_AREAS = new Set(["admin", "academics", "college", "people", "tpo", "tracker", "attendance"]);

(async () => {
  const { SENSITIVE_PATH } = await import("./security-central-rules.mjs");
  const files = cp.execFileSync("git", ["ls-files", "src/app/api"], { encoding: "utf8" }).split("\n").filter((f) => f.endsWith("/route.ts"));
  let changedFiles = 0, handlers = 0, skippedOwn = 0;
  for (const f of files) {
    if (!SENSITIVE_PATH.test(f.slice("src/app/api/".length)) || !STAFF_AREAS.has(f.split("/")[3])) continue;
    const src = fs.readFileSync(f, "utf8");
    if (!/@\/security\/secure-handler["']/.test(src) || /stepUp\s*:|requireRecentDeviceAuthentication/.test(src)) continue;
    let changed = false;
    const out = src.replace(/^export const (GET|POST|PUT|PATCH|DELETE) = secured\((handle\1)(, \{ csrf: "enforce" \})?\);/gm, (m, method, fn, enforce) => {
      const start = src.indexOf("async function " + fn + "(");
      const next = src.indexOf("\nexport const ", start);
      const body = src.slice(start, next < 0 ? undefined : next);
      const download = /attachment|text\/csv|Content-Disposition/i.test(body);
      const mutating = method !== "GET";
      if (mutating && !enforce) { skippedOwn++; return m; }
      if (!mutating && !download) return m;
      changed = true; handlers++;
      return "export const " + method + " = secured(" + fn + ", { " + (mutating ? 'csrf: "enforce", ' : "") + "stepUp: true });";
    });
    if (changed) { changedFiles++; if (APPLY) fs.writeFileSync(f, out); }
  }
  console.log(APPLY ? "APPLIED" : "DRY", { changedFiles, handlers, skippedOwn });
})();
