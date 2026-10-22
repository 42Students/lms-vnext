import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("G2-18-026-029 archived program identity",()=>{
 it("reserves case-insensitive department-local names and codes across archive",()=>{
  const service=readFileSync("src/modules/academics/program-service.ts","utf8");
  const start=service.indexOf("async function assertProgramUnique(");
  const end=service.indexOf("function mapProgramConstraint(",start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const precheck=service.slice(start,end);
  expect(precheck).toContain("eq(programs.departmentId, departmentId)");
  expect(precheck).toContain("lower(${programs.name})");
  expect(precheck).toContain("input.name.trim().toLowerCase()");
  expect(precheck).toContain("lower(${programs.code})");
  expect(precheck).toContain("input.code.trim().toLowerCase()");
  expect(precheck).not.toContain('eq(programs.status, "ACTIVE")');
  expect(service).toContain("PROGRAM_NAME_CONFLICT");
  expect(service).toContain("PROGRAM_CODE_CONFLICT");
 });
});
