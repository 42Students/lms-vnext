import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoRecruiterRequestAccessEnded} from "@/modules/placements/tpo-drive-lifecycle-list-model";
const NOW=new Date("2099-01-01T10:00:00.000Z");
const GRANT={status:"ACTIVE",validUntil:new Date("2099-01-02T10:00:00.000Z"),capabilities:["DRIVES"]};
describe("TPO-requests-verification-R02 truthful recruiter access ended review warning",()=>{
 it("reports recruiter ability from current persisted grant and active platform identity, not merely expiry",()=>{
  expect(tpoRecruiterRequestAccessEnded(GRANT,"ACTIVE",NOW)).toBe(false);
  expect(tpoRecruiterRequestAccessEnded(null,"ACTIVE",NOW)).toBe(true);
  expect(tpoRecruiterRequestAccessEnded({...GRANT,status:"REVOKED"},"ACTIVE",NOW)).toBe(true);
  expect(tpoRecruiterRequestAccessEnded({...GRANT,validUntil:null},"ACTIVE",NOW)).toBe(true);
  expect(tpoRecruiterRequestAccessEnded({...GRANT,validUntil:NOW},"ACTIVE",NOW)).toBe(true);
  expect(tpoRecruiterRequestAccessEnded({...GRANT,capabilities:["MESSAGES"]},"ACTIVE",NOW)).toBe(true);
  expect(tpoRecruiterRequestAccessEnded(GRANT,"DISABLED",NOW)).toBe(true);
 });
 it("retains the exact legacy recruiter context warning and comparison of saved request revisions",()=>{
  const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
  const lifecycle=read("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  const service=read("src/modules/placements/tpo-drive-lifecycle-list-service.ts");
  expect(lifecycle).toContain("Recruiter access ended. Finish this drive yourself.");
  expect(lifecycle).toContain("What changed since the last request");
  expect(lifecycle).toContain("Nothing that we compare changed.");
  expect(lifecycle).toContain("Open recruiter");
  expect(service).toContain("recruiterPlatformStatus:users.platformStatus");
  expect(service).toContain("relationshipStatus:placementCompanyRelationships.status");
  expect(service).toContain('accessEnded:row.relationshipStatus!=="ACTIVE"||');
  expect(service).toContain("capabilities:placementRecruiterCollegeGrants.capabilities");
  expect(service).toContain("tpoRecruiterRequestAccessEnded(grant??null,row.recruiterPlatformStatus,now)");
 });
});
