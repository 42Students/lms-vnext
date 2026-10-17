import {describe,it,expect} from "vitest";
import {tpoComparableDriveSnapshot,tpoDriveRequestDifferences} from "@/modules/placements/tpo-drive-request-diff-model";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO resubmitted drive review",()=>{
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
