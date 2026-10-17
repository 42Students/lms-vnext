import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {projectRecruiterProfileLinks,safeRecruiterExternalLink}
 from "@/modules/placements/recruiter-applicant-shared-links-model";

const doc={
 socialProfiles:{githubUrl:"https://github.com/learner",portfolioUrl:"https://portfolio.example/u"},
 skills:[{id:"00000000-0000-4000-8000-000000000001",name:"TypeScript",proficiency:"Advanced"}],
 projects:[{id:"00000000-0000-4000-8000-000000000002",name:"Course project",
 githubUrl:"https://github.com/learner/project",projectUrl:"",description:"",skills:[]}],
};
describe("REC-home-drives-38 recruiter applicant disclosures",()=>{
 it("REC-home-drives-38 rejects private-network portfolio destinations in mobile web views",()=>{
  for(const host of ["10.0.0.1","192.168.1.1","172.16.0.1",
   "172.31.255.255","169.254.169.254","0.0.0.0","127.2.3.4",
   "device.local","localhost","[::1]","[fc00::1]","[fd00::1]"]){
   expect(safeRecruiterExternalLink("https://"+host+"/hidden"),host).toBe(null);
  }
  expect(safeRecruiterExternalLink("https://portfolio.example/projects"))
   .toBe("https://portfolio.example/projects");
 });

 it("REC-home-drives-38 refuses javascript/insecure/private-network links and credential URLs",()=>{
  for(const value of ["javascript:alert(1)","http://github.com/u","https://user:pass@github.com/u",
   "https://localhost/private","https://127.0.0.1/private"]){
    expect(safeRecruiterExternalLink(value)).toBe(null);
  }
  expect(safeRecruiterExternalLink("https://evil.com/x",true)).toBe(null);
  expect(safeRecruiterExternalLink("https://github.com/u",true)).toBe("https://github.com/u");
 });
 it("REC-home-drives-38 fails closed without both project and skill consent",()=>{
  const nothing=projectRecruiterProfileLinks(doc,{projects:false,skills:false});
  expect(nothing).toEqual({githubUrl:null,portfolioUrl:null,skills:[],projects:[]});
  const projectsOnly=projectRecruiterProfileLinks(doc,{projects:true,skills:false});
  expect(projectsOnly.githubUrl).toBe("https://github.com/learner");
  expect(projectsOnly.portfolioUrl).toBe("https://portfolio.example/u");
  expect(projectsOnly.projects).toHaveLength(1);
  expect(projectsOnly.skills).toEqual([]);
  const skillsOnly=projectRecruiterProfileLinks(doc,{projects:false,skills:true});
  expect(skillsOnly.skills).toEqual(["TypeScript"]);
  expect(skillsOnly.githubUrl).toBe(null);
 });
 it("REC-home-drives-38 never exposes an unvalidated profile document or unsigned private resume",()=>{
  expect(projectRecruiterProfileLinks({socialProfiles:{githubUrl:"javascript:alert(1)"}},{projects:true,skills:true}).githubUrl).toBe(null);
  const reader=readFileSync("src/modules/placements/hr-job-read-service.ts","utf8");
  expect(reader).toContain("share?.columns?.includes(\"projects\")");
  expect(reader).toContain("share?.columns?.includes(\"skillMatch\")");
  expect(reader).toContain("placementCompanyVisibilitySettings.showProjectLinks");
  expect(reader).toContain("projectRecruiterProfileLinks(profileDocument");
  expect(reader).toContain("applications.map(({membershipId,profileDocument,...row})");
  const page=readFileSync("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx","utf8");
  expect(page).toContain('rel="noopener noreferrer"');
  expect(page).toContain("Skills provided by applicant");
  expect(page).not.toContain("profilePrivateDocumentReceipts.privateObjectKey");
 });
});
