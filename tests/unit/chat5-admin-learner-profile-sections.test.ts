import {describe,expect,it} from "vitest";
import {ADMIN_LEARNER_PROFILE_SECTIONS,projectAdminLearnerProfileSections} from "@/modules/people/admin-learner-profile-sections-model";

describe("G2-19-001-045 legacy learner profile details",()=>{
 it("preserves the exact twenty legacy learner sections in order",()=>{
  expect(ADMIN_LEARNER_PROFILE_SECTIONS.map(s=>s[1])).toEqual([
   "Header","About","Personal Details","Identity Documents","Languages",
   "Contact","Address","Social Profiles","Education","Job Preferences",
   "Resume","Certifications","Achievements","Skills","Projects",
   "Experience / Internships","Extra-curricular","Hobbies & Interests",
   "Video Intro","Metadata",
  ]);
 });
 it("shows authorized ordinary details, masks identity/files and secrets",()=>{
  const parts=projectAdminLearnerProfileSections({
   header:{headline:"Aspiring engineer",storageObjectKey:"secret-path",socialUrl:"https://example.com/me"},
   personalDetails:{nickname:"Learner",authToken:"private"},
   skills:[{name:"Java",score:4},{name:"SQL"}],
   identity:{aadhaar:"123456789012"},
   resume:{objectPath:"private/resume.pdf"},
   metadata:{apiKey:"private",note:"Interested in internships"},
  });
  expect(parts).toHaveLength(20);
  expect(parts.find(p=>p.key==="header")?.entries).toEqual([
   {label:"Headline",value:"Aspiring engineer"},
   {label:"Social Url",value:"Link on file"},
  ]);
  expect(parts.find(p=>p.key==="skills")?.entries.map(x=>x.value)).toContain("Java");
  expect(parts.find(p=>p.key==="resume")?.entries).toHaveLength(1);
  expect(parts.find(p=>p.key==="identity")?.entries).toHaveLength(1);
  const display=JSON.stringify(parts);
  for(const secret of ["123456789012","secret-path","private/resume.pdf","authToken","apiKey"])
   expect(display).not.toContain(secret);
 });
 it("treats absent sections as unrecorded and limits large profile collections",()=>{
  const sections=projectAdminLearnerProfileSections({skills:Array.from({length:150},(_,i)=>({name:"skill"+i}))});
  expect(sections.find(s=>s.key==="skills")?.entries.length).toBeLessThanOrEqual(40);
  expect(sections.find(s=>s.key==="about")?.present).toBe(false);
 });
});
