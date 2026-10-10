import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Static regression gate for the DB09 source-corruption incident 2026-10-11.
// No Drizzle migration or PostgreSQL contract is executed here.
// Run from repo root: node scripts/verify-db09-crm-source.mjs
const src = readFileSync("src/db/schema/tpo-crm.ts", "utf8");
const declarations = [...src.matchAll(/export const\s+(\w+)\s*=\s*pgTable\s*\(/g)]
  .map((match) => match[1]);
assert.deepEqual(declarations, [
  "placementTpoLeads", "placementTpoLeadActivities", "placementTpoFollowups",
], "Unexpected, missing or duplicate CRM table exports");
const required = [
  "placement_tpo_leads_phone_digits_ck",
  "placement_tpo_leads_invite_hash_ck",
  "placement_tpo_lead_activities_scoped_fk",
  "placement_tpo_followups_scoped_fk",
];
for (const name of required) {
  const matches = src.match(new RegExp(name, "g")) ?? [];
  assert.equal(matches.length, 1, `Missing or duplicate invariant: ${name}`);
}
const expectedChecks = ["sql`${t.phoneNorm} is null or ${t.phoneNorm} ~ '^[0-9]{7,20}$'`","sql`${t.inviteTokenHash} is null or ${t.inviteTokenHash} ~ '^[a-f0-9]{64}$'`"];
for (const expression of expectedChecks) {
  assert.ok(src.includes(expression), `Truncated or missing SQL expression: ${expression}`);
}
assert.equal((src.match(/\bexport const\b/g) ?? []).length, 3,
  "Unexpected exported constants in CRM table definitions");
console.log(JSON.stringify({
  sourceGuard: "PASS", uniqueTables: declarations, completeChecks: required,
  postgresTests: "NOT_EXECUTED",
}, null, 2));
