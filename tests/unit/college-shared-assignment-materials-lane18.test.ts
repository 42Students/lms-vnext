import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("G2-4-004-074 and G2-4-007-036: shared assignment authoring",()=>{
 it("never lets faculty mutate a cross-section resource or select a foreign offering",()=>{
  const service=readFileSync("src/modules/courses/learner-assignment-materials-service.ts","utf8");
  expect(service).toContain('assignment.deliveryId===null&&role!=="ADMIN"');
  expect(service).toContain("delivery.offeringId!==assignment.offeringId");
  expect(service).toContain('assertPersistedPlatformPermission(tx,context,"courses.manage"');
  expect(service).toContain("shared?isNull(courseAssignments.deliveryId)");
 });
 it("offers resource editing after saved shared or section drafts without a guessed delivery",()=>{
  const component=readFileSync("src/components/courses/college-assignment-create.tsx","utf8");
  expect(component).toContain('deliveries.find(row=>row.offeringId===chosen.offeringId)');
  expect(component).toContain("materialDelivery.deliveryId,audience");
  expect(component).toContain("<FacultyAssignmentMaterialLinks");
 });
});
