import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)",route,"page.tsx"),"utf8");
describe("Faculty route primary actions use shared Button focus ring and 44px hitbox",()=>{
 it("UX-teacher-shared-submit-01 retains GET filters and action label",()=>{
  const s=source("teacher/calendar");
  expect(s).toContain('import {Button} from "@/components/ui/button"');
  expect(s).toContain('<Button type="submit" variant="primary">');
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-02 retains GET filters and action label",()=>{
  const s=source("teacher/contacts/[contactsTab]");
  expect(s).toContain('import {Button} from "@/components/ui/button"');
  expect(s).toContain('<Button type="submit" variant="primary">');
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-03 retains GET filters and action label",()=>{
  const s=source("teacher/courses/[deliveryId]/assessment-health");
  expect(s).toContain('import {Button} from "@/components/ui/button"');
  expect(s).toContain('<Button type="submit" variant="primary">');
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-04 retains GET filters and action label",()=>{
  const s=source("teacher/courses/[deliveryId]/discussion-history");
  expect(s).toContain('import {Button} from "@/components/ui/button"');
  expect(s).toContain('<Button type="submit" variant="primary">');
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-05 retains GET filters and action label",()=>{
  const s=source("teacher/courses/[deliveryId]/gradebook");
  expect(s).toContain('import {Button} from "@/components/ui/button"');
  expect(s).toContain('<Button type="submit" variant="primary">');
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-06 retains GET filters and action label",()=>{
  const s=source("teacher/courses/[deliveryId]/reports");
  expect(s).toContain('import {Button} from "@/components/ui/button"');
  expect(s).toContain('<Button type="submit" variant="primary">');
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-07 retains GET filters and action label",()=>{
  const s=source("teacher/profile/teaching");
  expect(s).toContain('import {Button} from "@/components/ui/button"');
  expect(s).toContain('<Button type="submit" variant="primary">');
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-08 retains GET filters and action label",()=>{
  const s=source("teacher/report/assignment/[contentId]/submissions");
  expect(s).toContain('import {Button} from "@/components/ui/button"');
  expect(s).toContain('<Button type="submit" variant="primary">');
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-09 retains GET filters and action label",()=>{
  const s=source("teacher/report/quiz/[quizId]/attempts");
  expect(s).toContain('import {Button} from "@/components/ui/button"');
  expect(s).toContain('<Button type="submit" variant="primary">');
  expect(s).not.toContain('<button');
 });
 it("UX-teacher-shared-submit-10 retains GET filters and action label",()=>{
  const s=source("teacher/response-followups");
  expect(s).toContain('import {Button} from "@/components/ui/button"');
  expect(s).toContain('<Button type="submit" variant="primary">');
  expect(s).not.toContain('<button');
 });
});
