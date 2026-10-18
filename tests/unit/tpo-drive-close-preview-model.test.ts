import {describe,expect,it} from "vitest";
import {evaluateTpoDriveClosure,tpoDriveCloseSchema} from "@/modules/placements/tpo-drive-close-preview-model";
const before={applications:3,rounds:2,offers:1};
describe("TPO drive close preview",()=>{
 it("permits closing published drives with season evidence and unchanged counts",()=>{
  expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",before,before)).toBe("ALLOW");
  expect(evaluateTpoDriveClosure("DRAFT","ACTIVE",before,before)).toBe("READ_ONLY");
  // Closing a still-published drive remains valid after its season ends.
  // Closure is cleanup, not new recruiting/issuance; issued offers and
  // unreleased selections are still rejected by the service.
  expect(evaluateTpoDriveClosure("PUBLISHED","CLOSED",before,before)).toBe("ALLOW");
  expect(evaluateTpoDriveClosure("PUBLISHED",null,before,before)).toBe("READ_ONLY");
  expect(evaluateTpoDriveClosure("PUBLISHED","CLOSED",before,{...before,offers:0})).toBe("PREVIEW_STALE");
  expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",before,{...before,offers:0})).toBe("PREVIEW_STALE");
 });
 it("TPO-drive-workspace-17 refuses closure while any employer selection is not released",()=>{
  const before={applications:3,rounds:2,offers:1};
  expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",before,before,2)).toBe("UNRELEASED_SELECTIONS");
  expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",before,before,0)).toBe("ALLOW");
  expect(evaluateTpoDriveClosure("CLOSED","ACTIVE",before,before,2)).toBe("READ_ONLY");
 });
 it("refuses arbitrary status, forged college and missing confirmation",()=>{
  const valid={action:"CLOSE",confirmed:true,expectedUpdatedAt:"2026-10-14T14:00:00.123Z",
   expectedCounts:before,reason:"Closing after hiring round"};
  expect(tpoDriveCloseSchema.safeParse(valid).success).toBe(true);
  expect(tpoDriveCloseSchema.parse({...valid,expectedUpdatedAt:"2026-10-14T19:30:00.123+05:30"})
   .expectedUpdatedAt).toBe(valid.expectedUpdatedAt);
  expect(tpoDriveCloseSchema.safeParse({...valid,action:"CANCEL"}).success).toBe(false);
  expect(tpoDriveCloseSchema.safeParse({...valid,confirmed:false}).success).toBe(false);
  expect(tpoDriveCloseSchema.safeParse({...valid,collegeId:"forged"}).success).toBe(false);
 });
});
