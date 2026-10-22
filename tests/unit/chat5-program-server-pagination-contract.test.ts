import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const source=readFileSync("src/modules/academics/program-service.ts","utf8");

describe("G2-18-026-048 selected-college program paging contract",()=>{
 it("bounds server pages to the legacy 20-default / 100-max and counts the same college filter",()=>{
  const reader=source.slice(source.indexOf("export async function listProgramsPage("));
  expect(reader).toContain("const collegeId = collegeIdSchema.parse(collegeIdInput)");
  expect(reader).toContain('requirePermission(context, "academics.read"');
  expect(reader).toContain("const pageSize = Math.max(1, Math.min(100, Math.trunc(raw.pageSize ?? 20) || 20));");
  expect(reader).toContain("eq(departments.collegeId, collegeId)");
  expect(reader).toContain(".limit(pageSize).offset((page - 1) * pageSize)");
  expect(reader).toContain("totalPages: Math.max(1, Math.ceil(total / pageSize))");
 });
});
