import {describe,expect,it} from "vitest";
import {mentorReleaseDeleteSchema,mentorReleaseVersionMatches} from "@/modules/projects/mentor-release-version-model";

const version="2026-10-18T08:35:01.123Z";
describe("PROJ-BREAK-mentor-release: destructive edit integrity",()=>{
 it("PROJ-BREAK-release-race-01 only authorizes an exactly matching persisted version",()=>{
   const at=new Date(version);
   expect(mentorReleaseVersionMatches(at,version)).toBe(true);
   expect(mentorReleaseVersionMatches(at,"2026-10-18T14:05:01.123+05:30")).toBe(true);
   expect(mentorReleaseVersionMatches(at,"2026-10-18T08:35:01.122Z")).toBe(false);
   expect(mentorReleaseVersionMatches(at,"2026-10-18T08:35:01.124Z")).toBe(false);
 });
 it("PROJ-BREAK-release-race-02 fails closed on invalid timestamps or corrupted current date",()=>{
   expect(mentorReleaseVersionMatches(new Date(NaN),version)).toBe(false);
   expect(mentorReleaseVersionMatches(new Date(version),"invalid")).toBe(false);
   expect(mentorReleaseVersionMatches(new Date(version),"")).toBe(false);
 });
 it("PROJ-BREAK-release-race-03 requires a single ISO timestamp and rejects tenant injection",()=>{
   expect(mentorReleaseDeleteSchema.parse({expectedUpdatedAt:version})).toEqual({expectedUpdatedAt:version});
   for(const input of [
      {},null,{expectedUpdatedAt:""},{expectedUpdatedAt:"yesterday"},
      {expectedUpdatedAt:"2026-10-18"},{expectedUpdatedAt:version,projectId:"another-college"},
      {expectedUpdatedAt:version,releaseId:"forged"},
      {expectedUpdatedAt:version,confirmed:false},
   ])expect(mentorReleaseDeleteSchema.safeParse(input).success).toBe(false);
 });
});
