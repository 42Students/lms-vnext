import {beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({read:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/storage/private-object-storage",async original=>({
  ...await original<typeof import("@/modules/storage/private-object-storage")>(),
  readPrivateObjectAttestation:state.read,
}));
import {
  checkedGalleryObjectAttestation,LearnerGalleryError,
} from "@/modules/profile-verification/learner-image-gallery-service";
import {PrivateObjectStorageError} from "@/modules/storage/private-object-storage";

const access={
  membershipId:"11111111-1111-4111-8111-111111111111",
  collegeId:"22222222-2222-4222-8222-222222222222",
  canEdit:true,canUpload:true,
};
const key="private/22222222-2222-4222-8222-222222222222/11111111-1111-4111-8111-111111111111/profile-verification/33333333-3333-4333-8333-333333333333";

beforeEach(()=>state.read.mockReset());

describe("DB-007 gallery private scanner attestation",()=>{
  it("checks the exact college and membership scope before publishing",async()=>{
    const attestation={objectKey:key,generation:"1",contentType:"image/png",
      sizeBytes:128,sha256Hex:"a".repeat(64)};
    state.read.mockResolvedValueOnce(attestation);
    await expect(checkedGalleryObjectAttestation(key,access)).resolves.toEqual(attestation);
    expect(state.read).toHaveBeenCalledExactlyOnceWith(key,{
      collegeId:access.collegeId,ownerMembershipId:access.membershipId,
    });
  });
  it("maps pending or missing scanner evidence to a retryable upload conflict",async()=>{
    state.read.mockRejectedValueOnce(
      new PrivateObjectStorageError("PRIVATE_STORAGE_OBJECT_NOT_ATTESTED"));
    await expect(checkedGalleryObjectAttestation(key,access)).rejects.toMatchObject({
      name:"LearnerGalleryError",code:"GALLERY_RECEIPT_INVALID",
    });
  });
  it("never disguises provider outage, bad scope or an unexpected error",async()=>{
    for(const code of ["PRIVATE_STORAGE_PROVIDER_UNAVAILABLE","PRIVATE_STORAGE_INVALID_SCOPE"] as const){
      const cause=new PrivateObjectStorageError(code);
      state.read.mockRejectedValueOnce(cause);
      await expect(checkedGalleryObjectAttestation(key,access)).rejects.toBe(cause);
    }
    const cause=new Error("unexpected network error");
    state.read.mockRejectedValueOnce(cause);
    await expect(checkedGalleryObjectAttestation(key,access)).rejects.toBe(cause);
  });
  it("cannot return a fabricated CLEAN attestation when scanner read fails",async()=>{
    state.read.mockRejectedValueOnce(
      new PrivateObjectStorageError("PRIVATE_STORAGE_OBJECT_NOT_ATTESTED"));
    await expect(checkedGalleryObjectAttestation(key,access)).rejects.toBeInstanceOf(LearnerGalleryError);
  });
});
