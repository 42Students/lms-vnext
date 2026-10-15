import {describe,expect,it} from "vitest";
import {createClassTeamWorkspacesSchema} from "@/modules/projects/class-team-create-request";
import {previewVersion} from "@/modules/projects/class-team-preview-token";
const id="00000000-0000-4000-8000-000000000001";
describe("class workspace creation envelope",()=>{
 const teams=[{name:"Whole class",membershipIds:[id]}];
 it("accepts a whole-class workspace request",()=>{
 const parsed=createClassTeamWorkspacesSchema.parse({collegeId:id,classId:id,templateId:id,rosterRevision:"abc",baseTitle:"Project",baseSlug:"project",teams,expectedPreviewVersion:previewVersion(teams)});
 expect(parsed.teams).toEqual(teams);
 });
 it("rejects forged tenant keys",()=>expect(()=>createClassTeamWorkspacesSchema.parse({collegeId:id,classId:id,templateId:id,rosterRevision:"abc",baseTitle:"Project",baseSlug:"project",teams,expectedPreviewVersion:previewVersion(teams),organizationId:id})).toThrow());
});