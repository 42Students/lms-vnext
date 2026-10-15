import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {academicDirectoryHref,collegeBatchDirectorySchema,collegeSemesterDirectorySchema} from "@/modules/academics/college-academic-directory-model";
import {collegeStructureHref,collegeClassQuerySchema,collegeElectiveQuerySchema} from "@/modules/academics/college-structure-directory-model";

describe("College directory empty-state recovery",()=>{
 it("clears both academic directories without carrying stale page or college scope",()=>{
  expect(academicDirectoryHref("SEMESTERS",collegeSemesterDirectorySchema.parse({}))).toBe("/college/semesters");
  expect(academicDirectoryHref("BATCHES",collegeBatchDirectorySchema.parse({}))).toBe("/college/batches");
  const source=readFileSync(join(process.cwd(),"src/components/academics/college-academic-directory.tsx"),"utf8");
  expect(source).toContain("Clear filters and view all");
  expect(source).toContain('role="status"');
 });
 it("clears both structure directories without retaining page or college scope",()=>{
  expect(collegeStructureHref("CLASSES",collegeClassQuerySchema.parse({}))).toBe("/college/classes");
  expect(collegeStructureHref("ELECTIVES",collegeElectiveQuerySchema.parse({}))).toBe("/college/electives");
  const source=readFileSync(join(process.cwd(),"src/components/academics/college-structure-directory.tsx"),"utf8");
  expect(source).toContain("Clear filters and view all");
  expect(source).toContain('role="status"');
 });
});
