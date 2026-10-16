import {describe,expect,it} from "vitest";
import {tpoDriveRequestDecisionSchema,TPO_DRIVE_REQUEST_DECISION_COPY}
  from "@/modules/placements/tpo-drive-request-decision-model";
const id="11111111-1111-4111-8111-111111111111";
describe("TPO-requests-verification-34/35 decision validation",()=>{
  it("requires confirmation, bounded reason and optimistic status",()=>{
    const input={requestId:id,action:"APPROVE_LATER",
      expectedStatus:"REQUEST",reason:"Drive approved for review",confirmed:true};
    expect(tpoDriveRequestDecisionSchema.safeParse(input).success).toBe(true);
    expect(tpoDriveRequestDecisionSchema.safeParse({...input,confirmed:false}).success).toBe(false);
    expect(tpoDriveRequestDecisionSchema.safeParse({...input,reason:"x"}).success).toBe(false);
    expect(tpoDriveRequestDecisionSchema.safeParse({...input,collegeId:id}).success).toBe(false);
    expect(tpoDriveRequestDecisionSchema.safeParse({...input,action:"APPROVE_AND_PUBLISH"}).success).toBe(false);
  });
  it("uses legacy decision labels",()=>{
    expect(TPO_DRIVE_REQUEST_DECISION_COPY.decline).toBe("Decline this request");
    expect(TPO_DRIVE_REQUEST_DECISION_COPY.approve).toBe("Approve for later");
    expect(TPO_DRIVE_REQUEST_DECISION_COPY.sendBack).toBe("Request a change");
  });
});