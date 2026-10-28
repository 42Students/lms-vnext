import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { hrProfileDetailsSaveReceiptSchema } from "@/modules/placements/recruiter-profile-details-model";

const read=(path:string)=>readFileSync(path,"utf8");
describe("DB-004 canonical recruiter name boundary",()=>{
 it("preserves multi-word first/last names on read and browser save",()=>{
  const service=read("src/modules/placements/recruiter-profile-service.ts");
  const editor=read("src/components/hr/recruiter-profile-details-editor.tsx");
  const page=read("src/app/(authenticated)/hr/profile/page.tsx");
  const writer=read("src/modules/placements/recruiter-profile-details-service.ts");
  for(const item of [
    "canonicalFirstName: users.givenName",
    "canonicalLastName: users.familyName",
    "row.canonicalFirstName??nameParts[0]",
  ])expect(service).toContain(item);
  expect(page).toContain("initialFirstName={profile.canonicalFirstName}");
  expect(editor).toContain("initialFirstName!=null");
  expect(editor).toContain("confirmed.firstName??form.firstName");
  expect(editor).toContain("confirmed.lastName??form.lastName");
  expect(editor).not.toContain("splitHrRecruiterName(confirmed.displayName)");
  expect(writer).toContain("givenName:input.firstName");
  expect(writer).toContain("familyName:input.lastName||null");
  expect(writer).toContain("identityProfileVersion:sql");
 });
 it("validates server-confirmed name boundaries without assuming display-name tokens",()=>{
  const receipt=hrProfileDetailsSaveReceiptSchema.parse({profile:{
   displayName:"Mary Ann van der Berg",firstName:"Mary Ann",
   lastName:"van der Berg",title:"Manager",phone:"",
   changed:true,userUpdatedAt:"2026-10-28T00:00:00.000Z",
   profileUpdatedAt:"2026-10-28T00:00:00.000Z",
  }});
  expect(receipt.profile.firstName).toBe("Mary Ann");
  expect(receipt.profile.lastName).toBe("van der Berg");
 });
});
