import {describe,expect,it} from "vitest";
import {verificationSubmittedSqlBounds,matchesSubmittedFrom,matchesWaitingSince} from "@/modules/verification/queue-waiting-since";
describe("Verification SQL-pushed IST submission date window",()=>{
 it("preserves exact midnight boundaries and exclusive end for single day",()=>{
  const bounds=verificationSubmittedSqlBounds({submittedFrom:"2026-10-15",waitingSince:"2026-10-15"});
  expect(bounds.from?.toISOString()).toBe("2026-10-14T18:30:00.000Z");
  expect(bounds.before?.toISOString()).toBe("2026-10-15T18:30:00.000Z");
  expect(matchesSubmittedFrom(bounds.from!,"2026-10-15")).toBe(true);
  expect(matchesWaitingSince(new Date(bounds.before!.getTime()-1),"2026-10-15")).toBe(true);
  expect(matchesWaitingSince(bounds.before!,"2026-10-15")).toBe(false);
 });
 it("fails closed for impossible dates",()=>{
  expect(()=>verificationSubmittedSqlBounds({submittedFrom:"2026-02-30"})).toThrow();
  expect(verificationSubmittedSqlBounds({}).from).toBeUndefined();
 });
});
