import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const importer = readFileSync(
  "src/modules/bug-tracker/independent-audit-inbox-importer.ts", "utf8");
const manual = readFileSync(
  "src/app/api/tracker/audit-findings/sync/route.ts", "utf8");
const cron = readFileSync(
  "src/app/api/internal/audit-findings/sync/route.ts", "utf8");

test("manual importer live privilege recheck runs under its actual write transaction", () => {
  const transaction = importer.indexOf("return db.transaction(async tx=>{");
  const liveCheck = importer.indexOf(
    'await assertPersistedPlatformPermission(tx,actor,"admin-scope.select")');
  const read = importer.indexOf("const historical=");
  const mutation = importer.indexOf("await tx.insert(");
  assert.ok(transaction >= 0, "importer write must use database transaction");
  assert.ok(liveCheck > transaction, "actor recheck must be in write transaction");
  assert.ok(read > liveCheck, "no tenant data reads before authority recheck");
  assert.ok(mutation > liveCheck, "no importer SQL write before authority recheck");
  assert.match(importer, /if\(authority\.kind===ROLE.SUPER_ADMIN\)/);
  assert.match(importer, /throw new AuthorizationError\("admin-scope\.select"\)/);
});

test("manual and scheduler callers never silently share the same authority", () => {
  assert.match(importer, /authority: AuditImportAuthority/);
  assert.match(cron, /syncIndependentAuditInbox\(\{kind:"SCHEDULER"\}\)/);
  assert.match(manual, /syncIndependentAuditInbox\(\{kind:"SUPER_ADMIN",actor:context\}\)/);
  assert.match(manual, /await requireRecentDeviceAuthentication\(context\.user\.id\)/);
  assert.doesNotMatch(manual, /getDb\(\)\.transaction\(async tx/);
});
