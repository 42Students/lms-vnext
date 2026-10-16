import {describe,expect,it} from "vitest";
import {formatBatchRegistrationNotice,indianCalendarDate} from "@/modules/placements/tpo-batch-notification-model";
describe("TPO-batches-R03 and R05 registration notice and local date",()=>{
  it("includes batch name and exact IST deadline day on invite and reopen",()=>{
    const deadline=new Date("2026-12-17T18:29:59.999Z");
    expect(formatBatchRegistrationNotice("2023–27 CSE",deadline,false).body)
      .toBe("2023–27 CSE: registration is open. Register by 17 Dec 2026.");
    expect(formatBatchRegistrationNotice("2023–27 CSE",deadline,true).body)
      .toBe("2023–27 CSE: registration reopened. Register by 17 Dec 2026.");
  });
  it("derives date in college timezone rather than UTC calendar date",()=>{
    expect(indianCalendarDate(new Date("2026-10-16T20:30:00Z")))
      .toBe("2026-10-17");
  });
});
