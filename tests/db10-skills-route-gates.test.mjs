import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/skills/route.ts", "utf8");
const service = readFileSync("src/modules/skills/catalog-service.ts", "utf8");
const readiness = readFileSync("src/modules/skills/catalog-readiness.ts", "utf8");
const model = readFileSync("src/db/schema/db10-skills-catalog.draft.ts", "utf8");

test("skills route is disabled until explicit DB10 verified flag", () => {
  assert.match(readiness, /DB10_SKILLS_READY\s*===\s*"DB10_VERIFIED"/);
  assert.ok(
    route.indexOf("if (!skillsCatalogRuntimeEnabled())") <
      route.indexOf("await getCurrentRequestContext()"),
    "fail before any DB-backed query or session-dependent reader",
  );
  assert.match(route, /status:\s*503/);
});
test("read API never exposes an unauthenticated write or selection endpoint", () => {
  assert.match(route, /if \(!canReadSkillCatalog\(context\)\)/);
  assert.doesNotMatch(route, /export async function POST\(/);
  assert.match(route, /"Cache-Control":\s*"private, no-store"/);
});
test("catalog works with isolated unregistered draft and both independent counters", () => {
  assert.match(model, /export const db10Skills\s*=\s*pgTable/);
  assert.match(model, /export const db10SkillSynonyms\s*=\s*pgTable/);
  assert.match(model, /export const db10SkillUsage\s*=\s*pgTable/);
  assert.match(service, /db10-skills-catalog\.draft/);
  assert.match(service, /db10SkillUsage\.usageCount/);
  assert.match(service, /db10Skills\.usageCount/);
  assert.match(service, /synonym\.skill_id/);
  assert.match(service, /\.limit\(input\.limit\)/);
});
