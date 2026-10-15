import {describe,expect,it} from "vitest";
import {mustWithdrawPendingOfferOnDriveStop} from "@/modules/placements/job-service";

describe("P-S2-12 D11 close/stop outstanding offer policy",()=>{
  it("revokes only still actionable issued offers",()=>{
    expect(mustWithdrawPendingOfferOnDriveStop("ISSUED")).toBe(true);
    for(const s of ["ACCEPTED","DECLINED","EXPIRED","WITHDRAWN"]){
      expect(mustWithdrawPendingOfferOnDriveStop(s)).toBe(false);
    }
  });
});
