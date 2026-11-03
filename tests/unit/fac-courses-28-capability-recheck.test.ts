import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {
  sortFacultyRosterByRollThenName,facultyRosterPhotoPreview,facultyRosterMetrics,
} from "@/modules/courses/faculty-roster-display-model";

type Student={membershipId:string;displayName:string|null;email:string|null;
  rollNumber:string|null;phoneE164:string|null};
const students:Student[]=[
  {membershipId:"00000000-0000-4000-8000-000000000003",displayName:"Cara",
   rollNumber:null,email:null,phoneE164:null},
  {membershipId:"00000000-0000-4000-8000-000000000001",displayName:"Amy",
   rollNumber:"R10",email:"amy@example.edu",phoneE164:null},
  {membershipId:"00000000-0000-4000-8000-000000000002",displayName:"Ben",
   rollNumber:"R2",email:null,phoneE164:"+919876543210"},
];
const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("FAC-courses-28 legacy Faculty roster user jobs",()=>{
  it("has class selection for multiple authorized sections",()=>{
    const page=src("src/components/courses/faculty-course-tab-navigation.tsx");
    expect(page).toContain("teachingSections.length > 1");
    expect(page).toContain('id="faculty-course-section"');
    expect(page).toContain("Select class for ");
    expect(page).toContain("facultyCourseTabHref(event.target.value, activeTab)");
    expect(page).toContain("section.legacyClassId");
  });
  it("exposes the legacy contacts, roll-missing and visible-filter count affordances",()=>{
    expect(facultyRosterMetrics(students)).toEqual({
      contacts:2,missingRoll:1,contactLabel:"2 contacts",
      rollLabel:"1 without a roll number",
    });
    const page=src("src/components/courses/faculty-course-roster.tsx");
    expect(page).toContain("facultyRosterMetrics(learners)");
    expect(page).toContain('aria-label="Class roster metrics"');
    expect(page).toContain("Showing {filtered.length} of {learners.length} students");
    expect(page).toContain("Search by name, roll no, phone or email");
    expect(page).toContain("Phone");
    expect(page).toContain("Email");
  });
  it("sorts by numeric roll before name with unassigned rolls last",()=>{
    expect(sortFacultyRosterByRollThenName(students).map(x=>x.displayName))
      .toEqual(["Ben","Amy","Cara"]);
    expect(students.map(x=>x.displayName)).toEqual(["Cara","Amy","Ben"]);
  });
  it("supports safe avatar preview and initials fallback rather than loading a personal website URL",()=>{
    const id="10000000-0000-4000-8000-000000000001";
    expect(facultyRosterPhotoPreview("/api/files/"+id+"/download"))
      .toBe("/api/files/"+id+"/download");
    expect(facultyRosterPhotoPreview("https://personal.example.com/profile.png")).toBeNull();
    expect(facultyRosterPhotoPreview("/api/files/../../secret/download")).toBeNull();
    const page=src("src/components/courses/faculty-course-roster.tsx");
    expect(page).toContain("setPreview(learner)");
    expect(page).toContain("profile photo");
    expect(page).toContain("facultyRosterPhotoPreview(preview.photoDownloadUrl)");
    expect(page).toContain("No photo is available for this student.");
    expect(page).toContain("mailto:");
  });
});
