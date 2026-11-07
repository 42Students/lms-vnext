import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const alias=read("src/app/(authenticated)/superadmin/[...legacy]/page.tsx");
const legacy=read("src/modules/admin-ui/legacy-superadmin-destination-model.ts");
const canonicalIndex=read("src/app/(authenticated)/admin/projects/templates/page.tsx");
const canonicalNew=read("src/app/(authenticated)/admin/projects/templates/new/page.tsx");

test("G088 routes new template action without treating it as a saved slug",()=>{
  assert.match(alias,/segments\[2\]\?\.toLowerCase\(\) === "new"/);
  assert.match(alias,/requirePermission\(context, "project-template.manage"\)/);
  assert.match(alias,/return "\/admin\/projects\/templates\/new"/);
  assert.match(alias,/destination !== "\/admin\/projects\/templates\/new"/);
  assert.match(alias,/const id = await resolveTemplateBookmark\(context, templateToken\)/);
  assert.match(alias,/NUMERIC_LEGACY_ID\.test\(token\)/);
  assert.match(alias,/if \(!isSuperAdmin\(context\)\) redirect\("\/dashboard"\)/);
});

test("G088 preserves private index, detail and scoped template query state",()=>{
  assert.match(alias,/const matches = await getDb\(\)/);
  assert.match(alias,/if \(!id\) return null/);
  assert.match(alias,/destination\.startsWith\("\/admin\/projects\/templates\/"\)/);
  assert.match(alias,/search\.set\("collegeId", selectedCollegeId\)/);
  assert.match(alias,/search\.set\("return", query\["return"\]\)/);
  assert.match(legacy,/legacySuperAdminDestination/);
  assert.match(canonicalIndex,/getCurrentRequestContext\(\)/);
  assert.match(canonicalIndex,/can\(context,"project-template.read"\)/);
  assert.match(canonicalNew,/getCurrentRequestContext\(\)/);
  assert.match(canonicalNew,/project-template.manage/);
});

test("G088 deprecated bookmarks never authenticate or create a template",()=>{
  assert.doesNotMatch(alias,/\bfetch\(|\bPOST\b|apiFetch\(/);
  assert.doesNotMatch(alias,/dangerouslySetInnerHTML/);
  assert.match(alias,/notFound\(\)/);
  assert.match(alias,/requirePermission\(context, "project-template.read"\)/);
});
