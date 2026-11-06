import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/skills/route.ts", "utf8");
const selection = readFileSync("src/app/api/skills/selection/route.ts", "utf8");
const service = readFileSync("src/modules/skills/catalog-service.ts", "utf8");
const readiness = readFileSync("src/modules/skills/catalog-readiness.ts", "utf8");
const model = readFileSync("src/db/schema/db10-skills-catalog.draft.ts", "utf8");
const barrel = readFileSync("src/db/schema/index.ts", "utf8");
const get = route.slice(Math.max(route.indexOf("export async function GET("),route.indexOf("async function handleGET(")), route.indexOf("const skillSelectionSchema"));
const post = route.slice(Math.max(route.indexOf("export async function POST("),route.indexOf("async function handlePOST(")), route.indexOf("type ReadMode"));

test("skills GET is disabled until replay, synonym seed and source are verified", () => {
  assert.match(readiness, /\["DB10_SKILLS_READY"\]\s*===\s*"DB10_VERIFIED"/);
  assert.match(readiness, /\["DB10_SKILLS_SCHEMA_READY"\]\s*===\s*"DB10_REPLAY_VERIFIED"/);
  assert.match(readiness, /\["DB10_SKILLS_SYNONYMS_READY"\]\s*===\s*"SEED_VERIFIED"/);
  assert.match(readiness, /\["DB10_SKILLS_SOURCE_RECONCILED"\]\s*===\s*"LEGACY_RTF_RECONCILED"/);
  const gate = get.indexOf("if (!skillsCatalogRuntimeEnabled())");
  const dataContext = get.indexOf("const context = await getCurrentRequestContext();", gate);
  assert.ok(gate >= 0 && gate < dataContext, "ordinary read must fail before DB-backed catalog queries");
  // The only pre-gate GET branch is an authenticated, super-admin-only readiness report.
  assert.match(get.slice(0,gate), /if\(!isSuperAdmin\(context\)\|\|context\.user\.platformStatus!=="ACTIVE"\)/);
  assert.match(get, /status: 503/);
});

test("every skill selection route is same-origin, identity scoped, and fully gated", () => {
  assert.match(post, /if\(!isSameOriginRequest\(request\)\)/);
  assert.match(post, /if\(!skillsCatalogSchemaReady\(\)\)/);
  assert.match(post, /if\(!skillsCatalogRuntimeEnabled\(\)\)/);
  assert.match(post, /if\(!isSuperAdmin\(context\)\|\|context\.user\.platformStatus!=="ACTIVE"\)/);
  assert.match(route.slice(route.indexOf("async function recordSelectedSkillIds")),
    /if\(!canReadSkillCatalog\(context\)\)/);
  assert.match(selection, /if \(!isSameOriginRequest\(request\)\)/);
  assert.match(selection, /if \(!skillsCatalogRuntimeEnabled\(\)\)/);
  assert.match(selection, /if \(!canReadSkillCatalog\(context\)\)/);
  assert.match(route, /"Cache-Control":\s*"private, no-store"/);
  assert.match(selection, /"Cache-Control":\s*"private, no-store"/);
});

test("registered catalog retains two independent counters and many-to-many aliases", () => {
  assert.match(model, /export const db10Skills\s*=\s*pgTable/);
  assert.match(model, /export const db10SkillSynonyms\s*=\s*pgTable/);
  assert.match(model, /export const db10SkillUsage\s*=\s*pgTable/);
  assert.match(barrel, /db10Skills, db10SkillSynonyms, db10SkillUsage/);
  assert.match(service, /db10-skills-catalog\.draft/);
  assert.match(service, /db10SkillUsage\.usageCount/);
  assert.match(service, /db10Skills\.usageCount/);
  assert.match(service, /synonym\.skill_id/);
  assert.match(service, /\.limit\(input\.limit\)/);
});
