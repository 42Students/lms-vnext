import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("lane-8 schedule delivery link guard",()=>{
 it("revalidates active course links inside all schedule write transactions",()=>{
  const source=readFileSync("src/modules/academics/schedule-service.ts","utf8");
  expect(source).toContain("async function assertScheduleDeliveryInsideTransaction");
  expect(source).toContain("isNull(courseSectionDeliveries.endedAt)");
  expect(source).toContain('eq(courseOfferings.status, "ACTIVE")');
  expect(source).toContain('.for("share")');
  expect(source).toContain('eq(courseSectionDeliveries.sectionId, sectionId)');
  for(const call of [
   "assertScheduleDeliveryInsideTransaction(tx,input.deliveryId,input.sectionId)",
   "assertScheduleDeliveryInsideTransaction(tx,input.deliveryId,scope.sectionId)",
   "assertScheduleDeliveryInsideTransaction(tx,input.targetDeliveryId,target.id)",
  ])expect(source).toContain(call);
 });
 it("continues allowing section-only sessions without inventing a course",()=>{
  const source=readFileSync("src/modules/academics/schedule-service.ts","utf8");
  expect(source).toContain("if (input.deliveryId)");
  expect(source).toContain("if (input.targetDeliveryId)");
  expect(source).toContain("SCHEDULE_COURSE_DELIVERY_MISMATCH");
  expect(source).toContain("exceptEventId: eventId");
 });
});
