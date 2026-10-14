import {describe,expect,it} from "vitest";
import {evaluateTpoDriveDeadline,tpoDriveDeadlineSchema} from "@/modules/placements/tpo-drive-deadline-model";
describe("TPO deadline extension policy",()=>{
 it("requires a strictly later, future date on a published active-season drive",()=>{
  const before="2026-10-18T08:00:00.000Z",now="2026-10-14T14:00:00.000Z";
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",before,"2026-10-20T08:00:00Z",now)).toBe("ALLOW");
  expect(evaluateTpoDriveDeadline("DRAFT","ACTIVE",before,"2026-10-20T08:00:00Z",now)).toBe("READ_ONLY");
  expect(evaluateTpoDriveDeadline("PUBLISHED","CLOSED",before,"2026-10-20T08:00:00Z",now)).toBe("READ_ONLY");
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",null,"2026-10-20T08:00:00Z",now)).toBe("NO_OLD_DEADLINE");
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",before,before,now)).toBe("NOT_LATER");
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",before,"2026-10-12T08:00:00Z",now)).toBe("IN_PAST");
 });
 it("rejects unconfirmed and client-supplied college IDs",()=>{
  const raw={confirmed:true,expectedUpdatedAt:"2026-10-14T14:00:00.000Z",
   reason:"Employer requested extra time",newDeadlineIso:"2026-10-20T08:00:00.000Z"};
  expect(tpoDriveDeadlineSchema.safeParse(raw).success).toBe(true);
  expect(tpoDriveDeadlineSchema.parse({...raw,expectedUpdatedAt:"2026-10-14T19:30:00+05:30"})
   .expectedUpdatedAt).toBe(raw.expectedUpdatedAt);
  expect(tpoDriveDeadlineSchema.safeParse({...raw,confirmed:false}).success).toBe(false);
  expect(tpoDriveDeadlineSchema.safeParse({...raw,collegeId:"foreign"}).success).toBe(false);
 });
});
