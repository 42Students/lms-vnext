import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("ambiguous old Faculty assessment links",()=>{
 it("offers a section chooser only after an authorized faculty overview",()=>{
  const page=readFileSync(new URL("../../src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx",import.meta.url),"utf8");
  expect(page).toContain('error.code==="ASSIGNMENT_DELIVERY_MISMATCH"');
  expect(page).toContain('parsed.deliveryId===null');
  expect(page).toContain('getFacultyAssessmentOverview(context)');
  expect(page).toContain('item.id===parsed.assessmentId');
  expect(page).toContain('choices.length>1');
  expect(page).toContain('aria-label="Choose a teaching Section for the report"');
  expect(page).toContain('"?deliveryId="+encodeURIComponent(item.deliveryId)');
  expect(page).toContain('facultyAssignmentReportHidden(error)) notFound()');
 });
});
