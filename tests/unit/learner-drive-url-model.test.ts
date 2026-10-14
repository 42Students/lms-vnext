import {describe,expect,it} from "vitest";
import {learnerDriveQueryWithChanges,readLearnerDriveUrl} from "@/modules/placements/learner-drive-url-model";
describe("learner Drive URL and browser-history hydration model",()=>{
  it("reconstructs filters from a navigated URL and resets pagination on change",()=>{
    const before=readLearnerDriveUrl("q=backend&sort=newest&availability=closed&page=2&eligible=1");
    expect(before).toMatchObject({filters:{
      search:"backend",sort:"newest",availability:"closed",eligibleOnly:true,
    },page:2});
    const after=learnerDriveQueryWithChanges("q=backend&sort=newest&page=2",{q:"java"});
    expect(readLearnerDriveUrl(after)).toMatchObject({filters:{search:"java",sort:"newest"},page:1});
    expect(readLearnerDriveUrl("q=backend&sort=newest").filters.search).toBe("backend");
  });
  it("rejects injected tenant selectors and invalid enum/page combinations",()=>{
    const clean=learnerDriveQueryWithChanges("q=api&collegeId=foreign&membershipId=spoofed",{availability:"open"});
    expect(clean).not.toContain("collegeId");
    expect(clean).not.toContain("membershipId");
    expect(readLearnerDriveUrl("sort=arbitrary&page=NaN").filters.sort).toBe("deadline");
    expect(readLearnerDriveUrl("collegeId=foreign").filters.search).toBe("");
  });
});
