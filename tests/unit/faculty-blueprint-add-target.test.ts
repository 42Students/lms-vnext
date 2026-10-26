import {describe,it,expect} from "vitest";
import {FACULTY_BLUEPRINT_ADD_KINDS,facultyBlueprintAddTarget,facultyBlueprintCreateMode}
 from "../../src/modules/courses/faculty-blueprint-add-target";
describe("Blueprint add destinations",()=>{
 it("maps six scoped actions, preserving lesson and distinct form types",()=>{
  const links=FACULTY_BLUEPRINT_ADD_KINDS.map(kind=>facultyBlueprintAddTarget("delivery id","lesson/id",kind));
  expect(new Set(links).size).toBe(6);
  for(const link of links){
   const url=new URL(link,"https://faculty.example");
   expect(url.pathname).toContain("delivery%20id");
   expect(url.searchParams.get("lesson")).toBe("lesson/id");
  }
  for(const mode of ["VIDEO","YOUTUBE","RESOURCE","LIVE_CLASS"] as const){
   const url=new URL(links.find(x=>x.includes("create="+mode))!,"https://faculty.example");
   expect(url.searchParams.get("advanced")).toBe("1");
   expect(url.hash).toBe("#"+(mode==="VIDEO"?"faculty-video-upload-":"faculty-lesson-add-")+"lesson%2Fid");
  }
  expect(links[4]).toContain("/assignments/manage");
  expect(links[5]).toContain("/quizzes/manage");
 });
 it("rejects unknown or repeated creation modes",()=>{
  for(const mode of ["VIDEO","YOUTUBE","RESOURCE","LIVE_CLASS"] as const)
   expect(facultyBlueprintCreateMode(mode)).toBe(mode);
  for(const raw of [null,undefined,["VIDEO"],"ASSIGNMENT","",{}])
   expect(facultyBlueprintCreateMode(raw)).toBeNull();
 });
});
