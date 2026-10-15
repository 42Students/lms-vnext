import {describe,it,expect} from "vitest";
import {placementFeatureEffects,placementFeatureChangeSchema} from "@/modules/platform-settings/placement-feature-controls-model";
describe("placement feature controls",()=>{
 it("makes non-destructive disable behavior explicit",()=>{expect(placementFeatureEffects(false)).toMatchObject({access:"CLOSED",deletesData:false});});
 it("requires selected college and concurrency token",()=>{expect(placementFeatureChangeSchema.safeParse({collegeId:"invalid",enabled:false}).success).toBe(false);});
});
