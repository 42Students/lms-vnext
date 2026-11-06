import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/app/api/skills/route.ts", "utf8");
const selection = readFileSync("src/app/api/skills/selection/route.ts", "utf8");
const service = readFileSync("src/modules/skills/catalog-service.ts", "utf8");
const normalization = readFileSync("src/modules/skills/usage-normalization.ts", "utf8");

test("DB19-P30 import may run after verified schema, but live writes require full DB10 readiness", () => {
  const post = route.slice(Math.max(route.indexOf("export async function POST("),route.indexOf("async function handlePOST(")), route.indexOf("type ReadMode"));
  const schemaGate = post.indexOf("if(!skillsCatalogSchemaReady())");
  const importHandler = post.indexOf('if(action==="IMPORT_SKILLS")');
  const selectionGate = post.indexOf("if(!skillsCatalogRuntimeEnabled())", importHandler);
  const selectionParse = post.indexOf("const selected=selectionInput.parse(payload)");
  assert.ok(schemaGate >= 0 && schemaGate < importHandler);
  assert.ok(importHandler < selectionGate && selectionGate < selectionParse,
    "selection gate must run before parsing or recording live usage while import remains schema-only");
  assert.match(post.slice(selectionGate,selectionParse), /DB10_SKILLS_MIGRATIONS_PENDING/);
  assert.match(selection, /if \(!skillsCatalogRuntimeEnabled\(\)\)/);
});

test("DB19-P30 v2 writers cannot silently trim distinct legacy usage keys", () => {
  assert.match(normalization, /\.toLocaleLowerCase\("en-US"\)/);
  assert.doesNotMatch(normalization, /return\s+[^;]*\.trim\(\)[^;]*\.toLocaleLowerCase/);
  assert.match(route, /action:z\.literal\("SELECT_V2"\),\s*name:skillUsageNameSchema/);
  assert.match(service, /name:skillUsageNameSchema/);
  assert.match(service, /const name=normalizeSkillUsageKey\(data\.name\)/);
  assert.match(selection, /freeTextSkills: z\.array\(skillUsageNameSchema\)/);
  assert.match(selection, /const names = input\.freeTextSkills\.map\(normalizeSkillUsageKey\)/);
  assert.match(service, /usageCount:sql`\$\{db10Skills\.usageCount\}\+1`,\s*updatedAt:new Date\(\)/);
});

test("DB19-P30 catalog and v2 counter rows remain separate", () => {
  assert.match(service, /update\(db10Skills\)/);
  assert.match(service, /insert\(db10SkillUsage\)/);
  assert.match(service, /onConflictDoUpdate/);
  assert.match(selection, /usageCount: sql`\$\{db10SkillUsage\.usageCount\} \+ 1`/);
});
