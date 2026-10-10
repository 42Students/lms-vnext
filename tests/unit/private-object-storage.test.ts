import { describe, expect, it } from "vitest";
import {
  buildPrivateObjectKey,
  PrivateObjectStorageError,
  validatePrivateUploadRequest,
} from "@/modules/storage/private-object-storage";

const collegeId = "20000000-0000-4000-8000-000000000001";
const membershipId = "40000000-0000-4000-8000-000000000001";
const objectId = "70000000-0000-4000-8000-000000000001";

describe("private object storage contract", () => {
  it("builds an opaque tenant/member-scoped key", () => {
    expect(buildPrivateObjectKey({
      collegeId,
      ownerMembershipId: membershipId,
      namespace: "assignment-submission",
    }, objectId)).toBe(
      `private/${collegeId}/${membershipId}/assignment-submission/${objectId}`,
    );
  });

  it("rejects invalid scope", () => {
    expect(() => buildPrivateObjectKey({
      collegeId: "../../other",
      ownerMembershipId: membershipId,
      namespace: "course-resource",
    }, objectId)).toThrowError(PrivateObjectStorageError);
  });

  it("normalizes MIME and enforces size", () => {
    expect(validatePrivateUploadRequest({
      collegeId,
      ownerMembershipId: membershipId,
      namespace: "profile-verification",
      contentType: " Application/PDF ",
      expectedSizeBytes: 1024,
    })).toMatchObject({ contentType: "application/pdf", expectedSizeBytes: 1024 });

    expect(() => validatePrivateUploadRequest({
      collegeId,
      ownerMembershipId: membershipId,
      namespace: "profile-verification",
      contentType: "application/pdf",
      expectedSizeBytes: 26 * 1024 * 1024,
    })).toThrowError("PRIVATE_STORAGE_INVALID_SIZE");
  });

  it("rejects malformed MIME and overlong grants", () => {
    expect(() => validatePrivateUploadRequest({
      collegeId,
      ownerMembershipId: membershipId,
      namespace: "project-resource",
      contentType: "not a mime",
      expectedSizeBytes: 1,
    })).toThrowError("PRIVATE_STORAGE_INVALID_MIME");

    expect(() => validatePrivateUploadRequest({
      collegeId,
      ownerMembershipId: membershipId,
      namespace: "project-resource",
      contentType: "application/pdf",
      expectedSizeBytes: 1,
      expiresInMs: 16 * 60 * 1000,
    })).toThrowError("PRIVATE_STORAGE_INVALID_SIZE");
  });
});
