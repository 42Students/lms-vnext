import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const routes = [
  ["src/app/api/tracker/issues/route.ts", false],
  ["src/app/api/tracker/issues/[publicId]/route.ts", false],
  ["src/app/api/tracker/issues/[publicId]/workflow/route.ts", true],
  ["src/app/api/tracker/issues/[publicId]/retest/route.ts", true],
];

test("DB10 Tracker HTTP handlers fail closed before migration verification", () => {
  for (const [path, write] of routes) {
    const code = fs.readFileSync(path, "utf8");
    const handlers = [...code.matchAll(/export async function (GET|PATCH|POST|PUT)\s*\(/g)];
    const gates = [...code.matchAll(/trackerAdminRuntimeEnabled\(\)/g)];
    assert.ok(handlers.length > 0, `No HTTP handler in ${path}`);
    assert.equal(gates.length, handlers.length, `Ungated Tracker handler in ${path}`);
    assert.match(code, /DB10_TRACKER_MIGRATIONS_PENDING/);
    if (write) assert.match(code, /isSameOriginRequest\(request\)/);
  }
});
