import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {sortFacultyRosterByRollThenName,facultyRosterMetrics,facultyRosterPhotoPreview}
 from "@/modules/courses/faculty-roster-display-model";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const learners=[
 {membershipId:"00000000-0000-4000-8000-000000000001",displayName:"Zoe",rollNumber:null,email:null,phoneE164:null},
 {membershipId:"00000000-0000-4000-8000-000000000002",displayName:"Adam",rollNumber:"CS10",email:"adam@example.com",phoneE164:null},
 {membershipId:"00000000-0000-4000-8000-000000000003",displayName:"Bala",rollNumber:"CS2",email:null,phoneE164:"+919000000001"},
 {membershipId:"00000000-0000-4000-8000-000000000004",displayName:"Anna",rollNumber:"CS2",email:null,phoneE164:null},
];
describe("FAC-courses-28 roster parity with secure image fallback",()=>{
 it("FAC-courses-28 sorts by assigned roll numerically then learner name, missing rolls last",()=>{
  const sorted=sortFacultyRosterByRollThenName(learners);
  expect(sorted.map(v=>v.displayName)).toEqual(["Anna","Bala","Adam","Zoe"]);
  expect(sortFacultyRosterByRollThenName(learners)).toEqual(sorted);
 });
 it("FAC-courses-28 displays exact contact and missing-roll counts without inventing photos",()=>{
  expect(facultyRosterMetrics(learners)).toMatchObject({
   contacts:2,missingRoll:1,contactLabel:"2 contacts",rollLabel:"1 without a roll number",
  });
  expect(facultyRosterMetrics(learners.slice(1,3)).rollLabel).toBe("All have roll numbers");
  expect(facultyRosterPhotoPreview("https://tracking.example/face.jpg")).toBeNull();
  expect(facultyRosterPhotoPreview("javascript:alert(1)")).toBeNull();
  expect(facultyRosterPhotoPreview("/api/files/00000000-0000-4000-8000-000000000001/download"))
   .toBe("/api/files/00000000-0000-4000-8000-000000000001/download");
 });
 it("FAC-courses-28 makes a keyboard-operable, namespaced avatar preview and always-visible result count",()=>{
  const roster=read("src/components/courses/faculty-course-roster.tsx");
  const page=read("src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx");
  expect(roster).toContain('aria-label={"View "+nameOf(learner)+" profile photo"}');
  expect(roster).toContain("onClick={()=>setPreview(learner)}");
  expect(roster).toContain('import { Button } from "@/components/ui/button"');
  expect(read("src/components/ui/button.tsx")).toContain("focus-visible:outline-2");
  expect(roster).toContain('alt={"Profile photograph of "+nameOf(preview)}');
  expect(roster).toContain('<Dialog open={preview!==null}');
  expect(roster).toContain("No photo is available for this student.");
  expect(roster).toContain("Showing {filtered.length} of {learners.length} students");
  expect(roster).toContain("contactLabel");
  expect(roster).toContain("rollLabel");
  expect(page).toContain("listFacultyCourseDeliveries(context)");
  expect(page).toContain("getFacultyDeliveryRoster(");
 });
});
