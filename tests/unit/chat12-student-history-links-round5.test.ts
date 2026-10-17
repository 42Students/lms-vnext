import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {projectTpoStudentPlacementHistory} from "@/modules/placements/tpo-student-history-model";
const file=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO placement history drive and source",()=>{
 it("TPO-students-45 links to the real college drive and shows Add-by-College only with source evidence",()=>{
  const base={id:"a",jobId:"job-1",addedByCollege:true,jobTitle:"Role",companyName:"Company",
   seasonName:"Season",roleTitle:"Developer",applicationStatus:"SUBMITTED",channel:"INTERNAL",submittedAt:new Date("2099-01-01T00:00:00.000Z")};
  const x=projectTpoStudentPlacementHistory([base, {...base,id:"b",jobId:"job-2",addedByCollege:false}],[],[]);
  expect(x.items[0]).toMatchObject({jobId:"job-1",addedByCollege:true});
  expect(x.items[1]?.addedByCollege).toBe(false);
  const page=file("src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx");
  expect(page).toContain("Added by the college");
  expect(page).toContain("encodeURIComponent(item.jobId)");
 });
});
