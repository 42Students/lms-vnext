import {describe,it,expect} from "vitest";
import {tpoComparableDriveSnapshot,tpoDriveRequestDifferences} from "@/modules/placements/tpo-drive-request-diff-model";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO resubmitted drive review",()=>{
 it("TPO-requests-verification-R02 highlights numeric CTC, CGPA and backlog edits instead of hiding them",()=>{
  const prior={title:"Engineer",ctcLpa:7.5,minimumCgpa:6.25,
   maximumActiveBacklogs:1,branches:["CSE"],contactEmail:"private@employer.example"};
  const current={...prior,ctcLpa:8.25,minimumCgpa:7.5,
   maximumActiveBacklogs:0,branches:["CSE","ECE"]};
  const before=tpoComparableDriveSnapshot(prior);
  const after=tpoComparableDriveSnapshot(current);
  expect(before.ctcLpa).toBe("7.5");
  expect(after.ctcLpa).toBe("8.25");
  expect(before.minimumCgpa).toBe("6.25");
  expect(after.maximumActiveBacklogs).toBe("0");
  expect(before.contactEmail).toBeUndefined();
  const differences=tpoDriveRequestDifferences(prior,current);
  expect(differences.filter(row=>row.changed).map(row=>row.label))
   .toEqual(["Pay packages","Eligibility"]);
  expect(differences.find(row=>row.label==="Pay packages")?.after).toContain("8.25");
  expect(differences.find(row=>row.label==="Eligibility")?.after).toContain("7.5");
  expect(JSON.stringify(differences)).not.toContain("private@employer.example");
 });
 it("TPO-requests-verification-R02 ignores nonfinite and object-shaped candidate values",()=>{
  const candidate={ctcLpa:Infinity,minimumCgpa:NaN,
   branches:[{privateEmail:"private@example.com"},"CSE",123],
   internalMetadata:{secret:"never copy"}};
  const snap=tpoComparableDriveSnapshot(candidate);
  expect(snap.ctcLpa).toBe("");
  expect(snap.minimumCgpa).toBe("");
  expect(snap.branches).toBe("CSE, 123");
  expect(JSON.stringify(snap)).not.toContain("private@example.com");
  expect(JSON.stringify(snap)).not.toContain("never copy");
 });
 it("TPO-requests-verification-R02 compares stored before and after job facts without persisting recruiter identity",()=>{
  const previous={title:"Engineer",description:"Job",ctcLpa:"5.00",branches:["CS"],email:"secret@x.test"};
  const current={...previous,title:"Senior Engineer",ctcLpa:"7.00"};
  expect(tpoComparableDriveSnapshot(previous).email).toBeUndefined();
  const changes=tpoDriveRequestDifferences(previous,current);
  expect(changes.filter(c=>c.changed).map(c=>c.label)).toEqual(["Role","Pay packages"]);
  const writer=src("src/modules/placements/recruiter-drive-request-service.ts");
  const reader=src("src/modules/placements/tpo-drive-lifecycle-list-service.ts");
  const page=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(writer).toContain('input.action==="RESUBMIT"?original.draft:undefined');
  expect(reader).toContain("revisionByRequest");
  expect(reader).toContain("recruiterPhone:users.phoneE164");
  expect(page).toContain("What changed since the last request");
  expect(page).toContain("Nothing that we compare changed.");
  expect(page).toContain("Recruiter access ended. Finish this drive yourself.");
 });
});
