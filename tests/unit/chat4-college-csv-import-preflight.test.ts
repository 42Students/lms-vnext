import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("COL-people-R03 bounded college student CSV dry run",()=>{
 it("COL-people-R03 probes persisted identity conflicts without returning identifying information",()=>{
  const service=source("src/modules/people/college-student-csv-service.ts");
  expect(service).toContain("users.phoneE164");
  expect(service).toContain("users.email");
  expect(service).toContain("learnerProfiles.rollNumber");
  expect(service).toContain("eq(collegeMemberships.collegeId,member.collegeId)");
  expect(service).toContain('errors.push("PHONE_ALREADY_REGISTERED")');
  expect(service).toContain('errors.push("EMAIL_ALREADY_REGISTERED")');
  expect(service).toContain('errors.push("ROLL_NUMBER_ALREADY_REGISTERED")');
  expect(service).not.toContain("existingIdentities.map(row=>row.id)");
 });
 it("COL-people-R03 validates every row again before performing irreversible onboarding",()=>{
  const service=source("src/modules/people/college-student-csv-service.ts");
  const component=source("src/components/college/college-student-csv-import.tsx");
  expect(service).toContain('if (request.action === "PREVIEW")');
  expect(service).toContain('if (invalid > 0)');
  expect(service).toContain("RESOLVE_INVALID_ROWS_BEFORE_IMPORT");
  expect(component).toContain("report.invalid === 0");
  expect(component).toContain("All rows must validate before import");
  expect(service).toContain("onboardPersonWithRuntime");
 });
});
