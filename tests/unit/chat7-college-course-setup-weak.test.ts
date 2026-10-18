import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const file="src/modules/courses/college-course-setup-relations-service.ts";
const text=readFileSync(file,"utf8");
describe("COURSES-WEAK-SETUP-01 course setup relation SQL structural regression",()=>{
 it("does not alias the same academic_periods relation twice within one deliveries SELECT",()=>{
  const begin=text.indexOf("const deliveries=");
  const end=text.indexOf("const teachingAssignments=",begin);
  expect(begin).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(begin);
  const sql=text.slice(begin,end);
  expect((sql.match(/\.innerJoin\(academicPeriods/g)??[])).toHaveLength(1);
  expect((sql.match(/\.innerJoin\(sections/g)??[])).toHaveLength(1);
  expect(sql).toContain("eq(academicPeriods.collegeId,college.id)");
  expect(sql).toContain("eq(programDepartment.collegeId,college.id)");
  expect(sql).toContain("eq(sections.academicPeriodId,courseOfferings.academicPeriodId)");
 });
 it("independently scopes course offerings and faculty assignments to the same college before displaying",()=>{
  const offerings=text.slice(text.indexOf("const offerings="),text.indexOf("const deliveries="));
  const faculty=text.slice(text.indexOf("const teachingAssignments="));
  for(const query of [offerings,faculty]){
   expect(query).toContain("eq(departments.collegeId,college.id)");
   expect(query).toContain("eq(programDepartment.collegeId,college.id)");
  }
  expect(faculty).toContain("eq(collegeMemberships.collegeId,college.id)");
  expect(faculty).toContain("eq(courseOfferings.status,\"ACTIVE\")");
 });
 it("has one read permission and never uses a request-supplied college without authoritative resolution",()=>{
  expect(text).toContain("await loadAcademicCollegeScope(collegeId)");
  expect(text).toContain('requirePermission(context,"courses.read"');
  expect(text).toContain("collegeId:college.id");
 });
});
