import { describe, it, expect } from "vitest";
import { learnerDriveApplyGate,learnerDriveApplySelectionSchema } from "@/modules/placements/learner-drive-apply-model";
describe("learner drive apply confirmation",()=>{
  it("requires explicit consent to the selected role/channel",()=>{
    const roleOptionId="81818181-8181-4818-8818-818181818181";
    expect(learnerDriveApplySelectionSchema.safeParse({roleOptionId,channel:"INTERNAL",confirmed:true}).success).toBe(true);
    expect(learnerDriveApplySelectionSchema.safeParse({roleOptionId,channel:"INTERNAL",confirmed:false}).success).toBe(false);
    expect(learnerDriveApplySelectionSchema.safeParse({roleOptionId,channel:"INTERNAL",confirmed:true,collegeId:roleOptionId}).success).toBe(false);
  });
  it("disables duplicate, ineligible, expired and unsupported channel actions",()=>{
    const base={hasApplication:false,deadlinePassed:false,canApply:true,applicationMode:"INTERNAL",channel:"INTERNAL" as const};
    expect(learnerDriveApplyGate(base)).toBe("READY");
    expect(learnerDriveApplyGate({...base,hasApplication:true})).toBe("ALREADY_APPLIED");
    expect(learnerDriveApplyGate({...base,canApply:false})).toBe("NOT_ELIGIBLE");
    expect(learnerDriveApplyGate({...base,deadlinePassed:true})).toBe("DEADLINE_PASSED");
    expect(learnerDriveApplyGate({...base,applicationMode:"EXTERNAL_ONLY"})).toBe("CHANNEL_NOT_ALLOWED");
  });
});