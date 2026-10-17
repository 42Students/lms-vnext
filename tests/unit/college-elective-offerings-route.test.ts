import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const f=(s:string)=>readFileSync(new URL("../../"+s,import.meta.url),"utf8");
describe("COL-academic-setup-01 offering path",()=>{
 it("uses the existing tenant-validated elective offering writer, no invented schema",()=>{
  const api=f("src/app/api/academics/elective-slots/[slotId]/offerings/route.ts");
  const scope=f("src/modules/electives/college-offering-choices-service.ts");
  expect(api).toContain("createElectiveOffering(context,{slotId,courseId,groupId:groupId||undefined,backedDeliveryId,capacity})");
  expect(api).toContain("isSameOriginRequest(request)");
  expect(scope).toContain('eq(lmsGroups.collegeId,slot.collegeId)');
  expect(scope).toContain('eq(programs.id,slot.programId)');
 });
});
