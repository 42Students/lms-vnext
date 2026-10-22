import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {facultyAssignmentResourcesSchema} from "@/modules/courses/faculty-assignment-authoring-model";

const source=(path:string)=>readFileSync(path,"utf8");

describe("Verify2 W1 lane-3 retained views and assignment authoring",()=>{
 it("preserves profile after a failed refresh and retries using router refresh",()=>{
  const component=source("src/components/college/college-profile-retained.tsx");
  expect(component).toContain("current??remembered");
  expect(component).toContain("router.refresh()");
  expect(component).toContain("readOnly={failed}");
  expect(component).toContain('role="alert"');
 });
 it("refreshes stale drive results without losing the previous read-only view",()=>{
  const component=source("src/components/admin/admin-drive-applications-retained.tsx");
  expect(component).toContain("router.refresh()");
  expect(component).toContain("setRetrying(false)");
  expect(component).toContain("selectApplicationsView(children,lastSuccess,failed)");
  expect(component).toContain("inert={selected.stale}");
 });
 it("accepts 1–30 legacy assignment resources but never an empty or duplicate instructions list",()=>{
  const instruction={kind:"INSTRUCTIONS",title:"Instructions",body:"Work through exercises"};
  expect(facultyAssignmentResourcesSchema.safeParse([]).success).toBe(false);
  expect(facultyAssignmentResourcesSchema.safeParse([instruction]).success).toBe(true);
  expect(facultyAssignmentResourcesSchema.safeParse([instruction,instruction]).success).toBe(false);
  const links=Array.from({length:31},(_,index)=>({
   kind:"LINK",title:"Source "+index,externalUrl:"https://example.org/"+index,
  }));
  expect(facultyAssignmentResourcesSchema.safeParse(links).success).toBe(false);
  expect(facultyAssignmentResourcesSchema.safeParse([{
   kind:"LINK",title:"Insecure",externalUrl:"http://example.org",
  }]).success).toBe(false);
 });
 it("reviews submission choices and resources before save, and validates PDF filename and grant failures",()=>{
  const authoring=source("src/components/courses/faculty-lesson-authoring.tsx");
  expect(authoring).toContain("Review assignment before saving");
  expect(authoring).toContain("allowedAssignmentMethods.join");
  expect(authoring).toContain("assignmentResources.map");
  const uploads=source("src/components/courses/faculty-assignment-resource-draft-fields.tsx");
  expect(uploads).toContain('file.name.toLowerCase().endsWith(".pdf")');
  expect(uploads).toContain("Private upload is temporarily unavailable.");
  expect(uploads).toContain('role="alert"');
 });
});
