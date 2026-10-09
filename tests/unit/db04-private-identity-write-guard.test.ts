import { describe, expect, it } from "vitest";
import { upsertOwnLearnerProfileDocument, type ProfileRepository } from
  "@/modules/people/profile-service";
import type { RequestContext } from "@/modules/identity/context";

const context:RequestContext = {
  user:{id:"39076e31-c396-4dc1-8794-b80995588321",identityUid:"test",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"452f81e7-855f-4bc9-83e4-04adb3630212",
    collegeId:"96689c13-a97b-4be2-a5e8-1eec926e4afe",
    organizationId:"34642bfb-a394-4d73-a37d-ce3614e4f221",
    status:"ACTIVE",roles:["LEARNER"]},
};
describe("DB04 profile raw national-ID safe persistence guard",()=>{
  it("refuses Aadhaar writes before the normal profile JSON reaches storage",async()=>{
    let called=false;
    const repo={
      async upsertLearnerProfileDocument(){called=true;throw Error("should not persist");},
    } as unknown as ProfileRepository;
    await expect(upsertOwnLearnerProfileDocument(context,{
      identity:{aadhaarNumber:"123412341234"},
    },repo)).rejects.toThrowError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
    expect(called).toBe(false);
  });
  it("also rejects raw PAN writes",async()=>{
    let called=false;
    const repo={
      async upsertLearnerProfileDocument(){called=true;throw Error("should not persist");},
    } as unknown as ProfileRepository;
    await expect(upsertOwnLearnerProfileDocument(context,{
      identity:{panNumber:"ABCDE1234F"},
    },repo)).rejects.toThrowError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
    expect(called).toBe(false);
  });
});
