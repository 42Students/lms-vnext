import {describe,expect,it} from "vitest";
import {
 COLLEGE_ADMIN_QUICK_ACTIONS,COLLEGE_ADMIN_SETUP_PHASES,
 COLLEGE_SETUP_GUIDE_COPY,SUPER_ADMIN_GLOBAL_LINKS,
} from "@/modules/admin-ui/admin-dashboard-navigation";
import {
 COLLEGE_SETUP_DEEP_LINKS,collegeChecklistProjection,collegeSetupChecklistQuerySchema,
} from "@/modules/admin-ui/college-setup-checklist-model";
import {
 collegeTermCourseAddSchema,collegeTermCourseUpdateSchema,
 reorderTermCourseIds,nextTermCourseOrder,
} from "@/modules/academics/college-term-mapping-model";

const steps=COLLEGE_ADMIN_SETUP_PHASES.flatMap(phase=>phase.steps);
const evidence=Object.fromEntries(steps.map(step=>[step.key,0]));

describe("College academic setup prerequisites and mutation validation",()=>{
 it("COL-dashboard-12 preserves all 14 legacy steps and the required academic period prerequisite",()=>{
  const currentKeys=steps.map(step=>step.key);
  expect(currentKeys).toHaveLength(15);
  expect(new Set(currentKeys).size).toBe(15);
  expect(currentKeys.indexOf("academic-periods")).toBe(currentKeys.indexOf("semester-courses")+1);
  expect(currentKeys.indexOf("academic-periods")).toBe(currentKeys.indexOf("batches")-1);
  expect(steps.find(step=>step.key==="academic-periods")?.href).toBe("/college/academics");
  expect(COLLEGE_SETUP_GUIDE_COPY.heading).toBe("Setup Guide (Follow in Order)");
 });
 it("COL-dashboard-12 keeps active college quick actions while SA receives global recruiter accounts",()=>{
  expect(COLLEGE_ADMIN_QUICK_ACTIONS).toHaveLength(11);
  expect(new Set(COLLEGE_ADMIN_QUICK_ACTIONS.map(a=>a.key)).size).toBe(11);
  expect(SUPER_ADMIN_GLOBAL_LINKS.some(a=>a.href==="/admin/recruiters")).toBe(true);
  expect(SUPER_ADMIN_GLOBAL_LINKS.every(a=>a.href.startsWith("/admin/"))).toBe(true);
 });
 it("COL-academic-setup-10 has a local direct destination for every step",()=>{
  expect(steps.every(step=>COLLEGE_SETUP_DEEP_LINKS[step.key]===step.href)).toBe(true);
  expect(steps.every(step=>step.href.startsWith("/college/"))).toBe(true);
 });
 it("COL-academic-setup-10 rejects a foreign-college identifier in a checklist read",()=>{
  expect(collegeSetupChecklistQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(collegeSetupChecklistQuerySchema.safeParse({}).success).toBe(true);
 });
 it("COL-academic-setup-10 counts only nonnegative safe integers",()=>{
  for(const value of [-1,0.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]){
   expect(()=>collegeChecklistProjection({...evidence,faculty:value})).toThrow("SETUP_COUNT_UNAVAILABLE");
  }
  expect(()=>collegeChecklistProjection({...evidence,faculty:0})).not.toThrow();
 });
 it("COL-academic-setup-10 never invents a count for an omitted phase",()=>{
  expect(()=>collegeChecklistProjection({departments:1})).toThrow("SETUP_COUNT_UNAVAILABLE");
 });
 it("COL-academic-setup-10 projects verified counts without inventing completion",()=>{
  const projected=collegeChecklistProjection({...evidence,faculty:9,students:0});
  const rows=projected.flatMap(phase=>phase.steps);
  expect(rows.find(row=>row.key==="faculty")).toMatchObject({count:9,hasRecords:true});
  expect(rows.find(row=>row.key==="students")).toMatchObject({count:0,hasRecords:false});
 });
 it.each([0,-1,11,1.5,NaN])(
  "COL-academic-setup-06 refuses invalid curriculum credits %s",credits=>{
   expect(collegeTermCourseAddSchema.safeParse({
    programTermId:"11111111-1111-4111-8111-111111111111",
    courseId:"22222222-2222-4222-8222-222222222222",
    credits,type:"CORE",
   }).success).toBe(false);
 });
 it.each([1,3,10])("COL-academic-setup-06 accepts positive course credits %s",credits=>{
  expect(collegeTermCourseAddSchema.safeParse({
   programTermId:"11111111-1111-4111-8111-111111111111",
   courseId:"22222222-2222-4222-8222-222222222222",
   credits,type:"ELECTIVE",
  }).success).toBe(true);
 });
 it("COL-academic-setup-07 update rejects extra tenant IDs and invalid positions",()=>{
  expect(collegeTermCourseUpdateSchema.safeParse({credits:3,position:1}).success).toBe(true);
  expect(collegeTermCourseUpdateSchema.safeParse({credits:3,position:1,collegeId:"foreign"}).success).toBe(false);
  expect(collegeTermCourseUpdateSchema.safeParse({credits:3,position:0}).success).toBe(false);
  expect(collegeTermCourseUpdateSchema.safeParse({credits:3,position:1.1}).success).toBe(false);
 });
 it("COL-academic-setup-08 only reorders within the provided semester",()=>{
  expect(reorderTermCourseIds(["a","b","c"],"c",1)).toEqual(["c","a","b"]);
  expect(reorderTermCourseIds(["a","b","c"],"a",3)).toEqual(["b","c","a"]);
  expect(()=>reorderTermCourseIds(["a","b","c"],"foreign",2)).toThrow();
  expect(()=>reorderTermCourseIds(["a","b","c"],"a",4)).toThrow();
 });
 it("COL-academic-setup-08 places new mapping after the highest saved order",()=>{
  expect(nextTermCourseOrder([])).toBe(1);
  expect(nextTermCourseOrder([1,6,4])).toBe(7);
 });
});
