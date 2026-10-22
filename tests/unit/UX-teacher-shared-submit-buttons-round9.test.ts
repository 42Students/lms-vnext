import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)",route,"page.tsx"),"utf8");
describe("Faculty route primary actions use shared Button focus ring and 44px hitbox",()=>{
 it("UX-teacher-shared-submit-01 retains GET filters and action label",()=>{
  const s=source("teacher/calendar");
  expect(s).toMatch(/import\s*\{\s*Button\s*\}\s*from\s*"@\/components\/ui\/button"/);
  expect(s).toMatch(/<Button\s+type="submit"\s+variant="(?:primary|secondary)"/);
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-02 retains GET filters and action label",()=>{
  const s=source("teacher/contacts/[contactsTab]");
  expect(s).toMatch(/import\s*\{\s*Button\s*\}\s*from\s*"@\/components\/ui\/button"/);
  expect(s).toMatch(/<Button\s+type="submit"\s+variant="(?:primary|secondary)"/);
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-03 retains GET filters and action label",()=>{
  const s=source("teacher/courses/[deliveryId]/assessment-health");
  expect(s).toMatch(/import\s*\{\s*Button\s*\}\s*from\s*"@\/components\/ui\/button"/);
  expect(s).toMatch(/<Button\s+type="submit"\s+variant="(?:primary|secondary)"/);
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-04 retains GET filters and action label",()=>{
  const s=source("teacher/courses/[deliveryId]/discussion-history");
  expect(s).toMatch(/import\s*\{\s*Button\s*\}\s*from\s*"@\/components\/ui\/button"/);
  expect(s).toMatch(/<Button\s+type="submit"\s+variant="(?:primary|secondary)"/);
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-05 retains GET filters and action label",()=>{
  const s=source("teacher/courses/[deliveryId]/gradebook");
  expect(s).toMatch(/import\s*\{\s*Button\s*\}\s*from\s*"@\/components\/ui\/button"/);
  expect(s).toMatch(/<Button\s+type="submit"\s+variant="(?:primary|secondary)"/);
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-06 retains GET filters and action label",()=>{
  const s=source("teacher/courses/[deliveryId]/reports");
  expect(s).toMatch(/import\s*\{\s*Button\s*\}\s*from\s*"@\/components\/ui\/button"/);
  expect(s).toMatch(/<Button\s+type="submit"\s+variant="(?:primary|secondary)"/);
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-07 retains GET filters and action label",()=>{
  const s=source("teacher/profile/teaching");
  expect(s).toMatch(/import\s*\{\s*Button\s*\}\s*from\s*"@\/components\/ui\/button"/);
  expect(s).toMatch(/<Button\s+type="submit"\s+variant="(?:primary|secondary)"/);
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-08 retains GET filters and action label",()=>{
  const s=source("teacher/report/assignment/[contentId]/submissions");
  expect(s).toMatch(/import\s*\{\s*Button\s*\}\s*from\s*"@\/components\/ui\/button"/);
  expect(s).toMatch(/<Button\s+type="submit"\s+variant="(?:primary|secondary)"/);
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-09 retains GET filters and action label",()=>{
  const s=source("teacher/report/quiz/[quizId]/attempts");
  expect(s).toMatch(/import\s*\{\s*Button\s*\}\s*from\s*"@\/components\/ui\/button"/);
  expect(s).toMatch(/<Button\s+type="submit"\s+variant="(?:primary|secondary)"/);
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-10 retains GET filters and action label",()=>{
  const s=source("teacher/response-followups");
  expect(s).toMatch(/import\s*\{\s*Button\s*\}\s*from\s*"@\/components\/ui\/button"/);
  expect(s).toMatch(/<Button\s+type="submit"\s+variant="(?:primary|secondary)"/);
  expect(s).not.toContain('<button');
 });
});
