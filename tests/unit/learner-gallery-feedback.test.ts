import {describe,expect,it} from "vitest";
import {learnerGalleryConfirmationError} from "@/modules/profile-verification/learner-image-gallery-parity-model";

describe("DB-007 private learner-gallery confirmation feedback",()=>{
  it("does not call authorization failure a scanner delay",()=>{
    for(const status of [401,403]){
      expect(learnerGalleryConfirmationError(status,"GALLERY_FORBIDDEN")).toMatch(/permission/);
      expect(learnerGalleryConfirmationError(status,"GALLERY_FORBIDDEN")).not.toMatch(/scann/i);
    }
  });
  it("distinguishes missing setup, max gallery capacity and unverified uploads",()=>{
    expect(learnerGalleryConfirmationError(503,"GALLERY_NOT_READY")).toMatch(/not ready/);
    expect(learnerGalleryConfirmationError(409,"GALLERY_LIMIT")).toMatch(/ten photos/);
    const unverified=learnerGalleryConfirmationError(409,"GALLERY_RECEIPT_INVALID");
    expect(unverified).toMatch(/not passed private verification/);
    expect(unverified).toMatch(/retry/);
    expect(unverified).not.toMatch(/has finished|will pass/);
  });
  it("does not claim server/network failures are pending scanner verification",()=>{
    for(const status of [500,502,504]){
      const error=learnerGalleryConfirmationError(status,"PRIVATE_STORAGE_PROVIDER_UNAVAILABLE");
      expect(error).toMatch(/temporarily unavailable/);
      expect(error).not.toMatch(/scann/i);
    }
    expect(learnerGalleryConfirmationError(404)).toMatch(/could not be found/);
  });
});
