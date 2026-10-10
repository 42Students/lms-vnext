import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const routes=[
  "src/app/api/placements/tpo/company-visibility/route.ts",
  "src/app/api/placements/tpo/placement-rules/route.ts",
  "src/app/api/placements/tpo/follow-ups/[followupId]/done/route.ts",
  "src/app/api/placements/tpo/follow-ups/[followupId]/route.ts",
  "src/app/api/placements/tpo/follow-ups/due/route.ts",
  "src/app/api/placements/tpo/leads/[leadId]/route.ts",
  "src/app/api/placements/tpo/leads/check/route.ts",
  "src/app/api/placements/tpo/leads/[leadId]/activity/route.ts",
  "src/app/api/placements/tpo/leads/[leadId]/follow-ups/route.ts",
  "src/app/api/placements/tpo/leads/[leadId]/not-now/route.ts",
  "src/app/api/placements/tpo/leads/route.ts"
];

test("DB09 routes are all unavailable until migrations and verification", () => {
  for (const path of routes) {
    const code = fs.readFileSync(path, "utf8");
    const exports = [...code.matchAll(/export async function (GET|PUT|PATCH|POST)\s*\(/g)];
    const safeguards = [...code.matchAll(/process\.env\.DB09_TPO_API_READY !== "DB09_VERIFIED"/g)];
    assert.ok(exports.length > 0, `no handlers in ${path}`);
    assert.equal(
      safeguards.length, exports.length,
      `route has an ungated HTTP handler: ${path}`,
    );
    assert.match(code, /DB09_MIGRATIONS_PENDING/);
  }
});
