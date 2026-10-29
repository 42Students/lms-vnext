import {describe,expect,it} from "vitest";
import {nextGalleryInsert,type LearnerImageReference} from "@/modules/profile-verification/learner-image-gallery-parity-model";

const receipt="11111111-1111-4111-8111-111111111111";
const make=(overrides:Partial<LearnerImageReference>={}):LearnerImageReference=>({
  id:"22222222-2222-4222-8222-222222222222",
  legacyImageId:null,receiptId:receipt,displayOrder:0,isActive:true,
  deactivatedAt:null,...overrides,
});

describe("DB-007 idempotency and historical photo receipts",()=>{
  it("an active published receipt is a safe idempotent retry",()=>{
    expect(nextGalleryInsert([make()],receipt)).toEqual({
      kind:"EXISTS",id:"22222222-2222-4222-8222-222222222222",
    });
  });
  it("a deactivated receipt cannot be reused to falsely report a visible upload",()=>{
    expect(nextGalleryInsert([make({isActive:false,deactivatedAt:new Date()})],receipt))
      .toEqual({kind:"INACTIVE"});
    expect(nextGalleryInsert([make({isActive:false})],receipt)).toEqual({kind:"INACTIVE"});
  });
  it("different clean receipt may be published without reviving removed photo",()=>{
    expect(nextGalleryInsert([make({isActive:false,deactivatedAt:new Date()})],
      "33333333-3333-4333-8333-333333333333")).toEqual({kind:"APPEND",displayOrder:0});
  });
});
