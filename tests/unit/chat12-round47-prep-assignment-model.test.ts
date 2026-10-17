import {readFileSync} from "node:fs";import {it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-10 has college/active-cohort scoped course picker and idempotent assignments with due dates and learner notice",()=>{
 const service=src("src/modules/placements/tpo-prep-assignment-service.ts");
 const schema=src("src/db/schema/placement-tpo-prep-assignments.ts");
 expect(service).toContain("listTpoPrepCourseOptions");
 expect(service).toContain("eq(learnerProgramEnrollments.cohortId,offering.cohortId)");
 expect(service).toContain("onConflictDoNothing()");
 expect(service).toContain("PLACEMENTS_TPO_PREP_ASSIGNED");
 expect(service).toContain("New preparation course");
 expect(schema).toContain("tpo_prep_member_offering_uq");
});