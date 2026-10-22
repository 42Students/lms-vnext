import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("Verify2b G2-19-001 legacy Super Admin students",()=>{
 it("clears stale child options when the parent filter is removed",()=>{
  const source=readFileSync("src/modules/admin-ui/super-admin-people-filter-options.ts","utf8");
  expect(source).toContain("const batches=programId?input.batches.filter(row=>row.programId===programId):[]");
  expect(source).toContain("const batchId=programId&&input.batchId&&batches.some");
  expect(source).toContain("const classes=batchId?input.classes.filter(row=>row.cohortId===batchId):[]");
 });
 it("keeps the profile dialog name, wide layout and accessible shared Dialog",()=>{
  const source=readFileSync("src/components/college/college-person-profile-overview-modal.tsx","utf8");
  expect(source).toContain('title={"Profile — "+name}');
  expect(source).toContain('className="!max-w-[860px]"');
  expect(source).toContain("<Dialog");
 });
});
