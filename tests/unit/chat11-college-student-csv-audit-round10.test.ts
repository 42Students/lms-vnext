import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const code=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-11 repaired college CSV audit insert",()=>{
 it("COL-people-05 writes a typed same-college actor membership instead of an unknown union property",()=>{
  const csv=code("src/modules/people/college-student-csv-service.ts");
  const schema=code("src/db/schema/activity.ts");
  expect(csv).toContain("actorMembershipId: context.membership?.collegeId === member.collegeId &&");
  expect(csv).toContain("context.membership.organizationId === member.organizationId");
  expect(csv).toContain("? context.membership.id : null");
  expect(csv).not.toContain('actorMembershipId:"id" in member ? member.id : null');
  expect(schema).toContain('actorMembershipId: uuid(');
  expect(csv).toContain('module:"IDENTITY",eventType:"IDENTITY_COLLEGE_STUDENT_CSV_IMPORT"');
 });
});
