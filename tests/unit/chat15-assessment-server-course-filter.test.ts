import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("LEARNER-learning-misc-15 authenticated server-side course filtering",()=>{
 it("LEARNER-learning-misc-15 narrows SQL to authorized delivery IDs before assignment and quiz scans",()=>{
  const service=read("src/modules/courses/learner-assessment-service.ts");
  expect(service).toContain("learnerAssessmentAuthorizedCourse(options.courseId,deliveries)");
  expect(service).toContain("deliveries.filter(row=>row.courseId===selectedCourseId)");
  expect(service).toContain("listOwnLearnerAssessmentRows(scopedDeliveries");
  const query=read("src/modules/courses/learner-assessment-flat-query.ts");
  expect(query).toContain("inArray(courseSectionDeliveries.id,ids)");
  expect(query).toContain("eq(assignmentSubmissions.membershipId,membershipId)");
 });
 it("LEARNER-learning-misc-15 retains URL-backed course filter for both assessment pages",()=>{
  for(const path of [
   "src/app/(authenticated)/learn/allAssignments/page.tsx",
   "src/app/(authenticated)/learn/allQuizzes/page.tsx",
  ]){
   const page=read(path);
   expect(page).toContain("searchParams");
   expect(page).toContain("courseId:query.course");
   expect(page).toContain("initialCourseId={overview.selectedCourseId");
  }
  const ui=read("src/components/courses/learner-assessment-overview.tsx");
  expect(ui).toContain("learnerAssessmentCourseHref(kind,event.target.value||null)");
  expect(ui).toContain("router.push(");
 });
});
