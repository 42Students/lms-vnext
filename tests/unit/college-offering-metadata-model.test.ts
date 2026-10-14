import {describe,expect,it} from "vitest";
import {collegeOfferingMetadataSchema,offeringMetadataChangeAffectsDelivery}
  from "@/modules/courses/college-offering-metadata-model";
describe("College course offering metadata",()=>{
  const base={expectedUpdatedAt:"2026-10-14T08:09:10.123Z",
    type:"CORE",credits:3,displayOrder:2,confirm:true};
  it("requires explicit optimistic token and confirmation without tenant overrides",()=>{
    expect(collegeOfferingMetadataSchema.parse(base)).toMatchObject(base);
    for(const patch of [{confirm:false},{expectedUpdatedAt:"invalid"},
      {credits:31},{displayOrder:-1},{collegeId:"forged"}])
      expect(collegeOfferingMetadataSchema.safeParse({...base,...patch}).success).toBe(false);
  });
  it("allows ordering changes but detects delivery-sensitive changes",()=>{
    const current={type:"CORE",credits:3};
    expect(offeringMetadataChangeAffectsDelivery(current,{type:"CORE",credits:3})).toBe(false);
    expect(offeringMetadataChangeAffectsDelivery(current,{type:"ELECTIVE",credits:3})).toBe(true);
    expect(offeringMetadataChangeAffectsDelivery(current,{type:"CORE",credits:null})).toBe(true);
  });
});
