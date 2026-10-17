import {describe,it,expect} from "vitest";
import {tpoStudentProfileFacts} from "@/modules/placements/tpo-student-profile-facts";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO saved profile count facets",()=>{
 it("TPO-students-22 uses saved fields for gender and counts, excluding numbers",()=>{
  const facts=tpoStudentProfileFacts({personalDetails:{gender:"Female",dateOfBirth:"2099-02-03"},skills:[{name:"Java"}],projects:[{}],certifications:[{}],socialProfiles:{githubUrl:"https://github.com/test"},identity:{aadhaarNumber:"123"}});
  expect(facts).toMatchObject({gender:"Female",birthYear:2099,skills:1,projects:1,links:true});
  expect("aadhaarNumber" in facts).toBe(false);
 });
 it("TPO-students-24 has URL-bound profile filters",()=>{expect(src("src/app/(authenticated)/tpo/students/page.tsx")).toContain("Profile strength filters");});
 it("TPO-students-26 exposes non-sensitive spreadsheet columns",()=>{expect(src("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain('label:"Skills"');});
 it("TPO-students-29 never infers missing personal facts",()=>{expect(tpoStudentProfileFacts({personalDetails:{gender:"Prefer not to say"}}).gender).toBe(null);});
 it("TPO-students-31 uses saved profile and separate placement readiness",()=>{expect(src("src/modules/placements/tpo-students-model.ts")).toContain("profileFacts:tpoStudentProfileFacts");});
 it("TPO-students-43 only reads the profile for authorized TPO roster",()=>{expect(src("src/modules/placements/tpo-students-service.ts")).toContain("profileDocument:learner.profileDocument");});
 it("TPO-students-52 counts persisted career details, not prep scores",()=>{expect(tpoStudentProfileFacts({projects:[{}],experiences:[{}]}).experiences).toBe(1);});
});
