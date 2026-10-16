import {describe,expect,it} from "vitest";
import {COLLEGE_ADMIN_SETUP_PHASES} from "@/modules/admin-ui/admin-dashboard-navigation";
describe("COL-dashboard-13 setup guide routes",()=>{
 it("links every setup card to the corresponding college admin workflow",()=>{
  const expected={
   "Add Lessons":"/college/lessons","Add Lesson Content":"/college/videos",
   "Create Semesters":"/college/semesters",
   "Map courses to semesters":"/college/semester-courses",
   "Create Batches":"/college/batches","Create Classes":"/college/classes",
   "Add Faculty":"/college/faculty","Add Students":"/college/students",
  };
  const steps=COLLEGE_ADMIN_SETUP_PHASES.flatMap((x): readonly {label:string;href:string}[]=>x.steps);
  for(const [label,href] of Object.entries(expected)){
   expect(steps.find(step=>step.label===label)?.href).toBe(href);
  }
 });
});
