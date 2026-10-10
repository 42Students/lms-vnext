import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const routes = [
  ["src/app/api/announcements/admin/route.ts", 2, true],
  ["src/app/api/announcements/[announcementId]/route.ts", 2, true],
  ["src/app/api/announcements/[announcementId]/restore/route.ts", 1, true],
  ["src/app/api/announcements/mine/route.ts", 1, false],
];

test("DB10 announcement routes fail closed until migration verification", () => {
  for (const [path, expectedHandlers, hasWrites] of routes) {
    const code = fs.readFileSync(path, "utf8");
    const handlers = [...code.matchAll(/export async function (GET|POST|PATCH|DELETE)\s*\(/g)];
    const gates = [...code.matchAll(/announcementsRuntimeEnabled\(\)/g)];
    assert.equal(handlers.length, expectedHandlers, `Unexpected handler count: ${path}`);
    assert.equal(gates.length, handlers.length, `Ungated announcement handler: ${path}`);
    assert.match(code, /DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING/);
    if (hasWrites) assert.match(code, /isSameOriginRequest\(request\)/);
  }
});

test("announcement draft is not registered in the shared schema barrel", () => {
  const barrel = fs.readFileSync("src/db/schema/index.ts", "utf8");
  assert.doesNotMatch(barrel, /db10-announcements\.draft/);
});
