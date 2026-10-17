import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {learnerSemesterOptions} from "@/modules/courses/learner-program-semester-options-model";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const courses=[{id:"period-one",name:"Semester 1",startDate:"2026-01-01"}];
const curriculum=[{termNumber:1,name:"Semester 1"},{termNumber:2,name:"Semester 2"},{termNumber:3,name:"Semester 3"}];
describe("chat-12 final sprint learner course navigation and safety",()=>{
 it("LEARNER-home-courses-01 keeps the multi-role dashboard with explicit learner courses navigation",()=>{
  const model=read("src/components/dashboard/membership-dashboard-model.ts");
  expect(model).toContain('"COLLEGE_ADMIN"');
  expect(model).toContain('"LEARNER"');
  const page=read("src/app/(authenticated)/dashboard/page.tsx");
  expect(page).toContain('hasWorkspace("LEARNER")');
  expect(page).toContain('/learn/courses');
 });
 it("LEARNER-home-courses-02 lists undelivered future terms without creating fictitious deliveries",()=>{
  const actual=learnerSemesterOptions(courses,curriculum);
  expect(actual.map(x=>x.name)).toEqual(["Semester 1","Semester 2","Semester 3"]);
  expect(actual[0].id).toBe("period-one");
  expect(actual.slice(1).map(x=>x.id)).toEqual(["program-term:2","program-term:3"]);
 });
 it("LEARNER-home-courses-02 matches curriculum semester numbers when names include academic-year prefix",()=>{
  const actual=learnerSemesterOptions([{id:"period-two",name:"2026 Semester 2",startDate:"2026-08-01"}],curriculum);
  expect(actual[1].id).toBe("period-two");
 });
 it("LEARNER-home-courses-02 does not attach unrelated numbered periods to an empty future semester",()=>{
  const actual=learnerSemesterOptions([{id:"period-four",name:"2026 Semester 4",startDate:"2026-01-01"}],curriculum);
  expect(actual[2].id).toBe("program-term:3");
  expect(actual.some(x=>x.id==="period-four")).toBe(true);
 });
 it("LEARNER-home-courses-02 scopes curriculum lookup to active learner membership and program",()=>{
  const service=read("src/modules/courses/learner-course-setup-service.ts");
  expect(service).toContain("listLearnerProgramSemesters(context:RequestContext)");
  expect(service).toContain('eq(learnerProgramEnrollments.membershipId,member.id)');
  expect(service).toContain('eq(learnerProgramEnrollments.status,"ACTIVE")');
  expect(service).toContain("eq(programTerms.programId,active[0].programId)");
 });
 it("LEARNER-home-courses-02 renders a named honest empty semester and retains the semester selector",()=>{
  const list=read("src/components/courses/learner-course-list.tsx");
  expect(list).toContain("rows.length === 0 && periods.length===0");
  expect(list).toContain('"No courses found for "+selectedPeriod.name+"."');
  expect(list).toContain("learnerSemesterOptions(delivered,programSemesters)");
 });
 it("LEARNER-course-detail-R02 never silently assumes a five-minute authoring duration",()=>{
  const author=read("src/components/courses/faculty-lesson-authoring.tsx");
  const editor=read("src/components/courses/faculty-content-editor.tsx");
  expect(author).toContain('setDurationSeconds("")');
  expect(author).not.toContain('setDurationSeconds("300")');
  expect(editor).not.toContain("item.durationSeconds ?? 300");
  expect(editor).toContain("Actual video duration (seconds)");
  expect(author).toContain("duration < 1");
 });
 it("LEARNER-course-detail-R02 refuses progress completion without a persisted actual duration",()=>{
  const progress=read("src/modules/courses/progress-service.ts");
  expect(progress).toContain("shouldComplete = duration>0");
  expect(progress).toContain("watchedThresholdPercent");
 });
 it("LEARNER-course-detail-R03 exposes authorized future LIVE_CLASS external links but no private content storage",()=>{
  const service=read("src/modules/courses/learner-course-service.ts");
  expect(service).toContain("learnerVisibleContentExternalUrl({");
  expect(service).toContain('row.contentType === "LIVE_CLASS"');
  expect(service).toContain('contentAvailability === "AVAILABLE"');
  const control=read("src/components/courses/learner-live-class-link.tsx");
  expect(control).toContain("Copy");
 });
});
