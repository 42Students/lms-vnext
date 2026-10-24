import {describe,it,expect} from "vitest";
import {canAttachProjectFileToResource as attach,mentorResourceNeedsVerifiedFile as needsFile}
 from "@/modules/projects/mentor-file-resource-visibility-model";
describe("Mentor file placeholder and linked attachment visibility",()=>{
 it("lets Mentor/Admin attach to drafts but learner only to public active",()=>{
  const draft={status:"DRAFT",visibility:"TEAM"};
  expect(attach("MENTOR",draft)).toBe(true);
  expect(attach("ADMIN",{...draft,visibility:"MENTOR_ONLY"})).toBe(true);
  expect(attach("LEARNER",draft)).toBe(false);
  expect(attach("LEARNER",{status:"ACTIVE",visibility:"MENTOR_ONLY"})).toBe(false);
  expect(attach("LEARNER",{status:"ACTIVE",visibility:"TEAM"})).toBe(true);
  expect(attach("MENTOR",{status:"ARCHIVED",visibility:"TEAM"})).toBe(false);
  expect(attach("MENTOR",null)).toBe(false);
 });
 it("requires a verified file only for a bare FILE/DOCUMENT publication",()=>{
  expect(needsFile({status:"ACTIVE",resourceType:"FILE",url:null,description:null})).toBe(true);
  expect(needsFile({status:"ACTIVE",resourceType:"DOCUMENT",url:null,description:""})).toBe(true);
  expect(needsFile({status:"DRAFT",resourceType:"FILE",url:null,description:null})).toBe(false);
  expect(needsFile({status:"ACTIVE",resourceType:"LINK",url:null,description:null})).toBe(false);
  expect(needsFile({status:"ACTIVE",resourceType:"FILE",url:"https://example.org/file.pdf",description:null})).toBe(false);
 });
});
