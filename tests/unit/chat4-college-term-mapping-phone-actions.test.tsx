import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {
 reorderTermCourseIds,collegeTermCourseUpdateSchema,collegeTermMappingErrorMessage,
} from "@/modules/academics/college-term-mapping-model";

vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("@/components/ui/confirm-dialog",async()=>{
 const {createElement}=await import("react");
 return {ConfirmDialog:(p:{open:boolean})=>p.open?
  createElement("section",null,"Confirm mapping"):null};
});
import {CollegeTermMappingManager} from "@/components/academics/college-term-mapping-manager";

describe("COL-UX-TERM-MAPPINGS-04 keyboard/mobile curriculum mapping",()=>{
 it("allows moving the same mapped course up/down by keyboard using 1-indexed order",()=>{
  const list=["course-1","course-2","course-3"];
  expect(reorderTermCourseIds(list,"course-3",1)).toEqual(["course-3","course-1","course-2"]);
  expect(reorderTermCourseIds(list,"course-1",3)).toEqual(["course-2","course-3","course-1"]);
  expect(list).toEqual(["course-1","course-2","course-3"]);
 });
 it("rejects invalid, duplicate-position or missing-course moves before sending updates",()=>{
  for(const position of [-1,0,4,1.5,NaN])
   expect(()=>reorderTermCourseIds(["a","b","c"],"b",position)).toThrow("TERM_COURSE_POSITION_INVALID");
  expect(()=>reorderTermCourseIds(["a","b","c"],"foreign",2))
   .toThrow("TERM_COURSE_POSITION_INVALID");
  expect(collegeTermCourseUpdateSchema.safeParse({credits:3,position:2}).success).toBe(true);
  expect(collegeTermCourseUpdateSchema.safeParse({credits:11,position:2}).success).toBe(false);
  expect(collegeTermCourseUpdateSchema.safeParse({credits:3,position:0}).success).toBe(false);
 });
 it("retains the empty-state guidance instead of rendering a zero-row modal or phantom mapping",()=>{
  const html=renderToStaticMarkup(<CollegeTermMappingManager
   data={{terms:[],courses:[],mapped:[]}}/>);
  expect(html).toContain("Select a program and semester to view mapped courses");
  expect(html).toContain("Add Courses to Semester");
  expect(html).not.toContain("<table");
 });
 it("renders one DataTable with all original actions, drag fallback and phone-visible order controls",()=>{
  const source=readFileSync("src/components/academics/college-term-mapping-manager.tsx","utf8");
  expect(source).toContain('caption="Semester course mappings"');
  expect(source).toContain('mobilePriority:"primary"');
  expect(source).toContain('mobilePriority:"action"');
  expect(source).toContain('draggable={!pending}');
  expect(source).toContain('onDrop={event=>');
  expect(source).toContain('aria-label={"Move "+row.courseName+" up"}');
  expect(source).toContain('aria-label={"Move "+row.courseName+" down"}');
  expect(source).not.toContain("<table");
 });
 it("rejects simultaneous mutations and maps failures to friendly copy",()=>{
  const source=readFileSync("src/components/academics/college-term-mapping-manager.tsx","utf8");
  expect(source).toContain("if (!confirm || inFlight.current) return;");
  expect(source).toContain("if(inFlight.current)return;");
  expect(source.match(/inFlight.current=false;/g)).toHaveLength(2);
  expect(collegeTermMappingErrorMessage("TERM_COURSE_POSITION_INVALID"))
   .toContain("Choose a position");
  expect(source).not.toContain('cause.message');
 });
});
