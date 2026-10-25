import {describe,expect,it} from "vitest";
import {RECRUITER_CHANGE_SHORTCUTS,recruiterChangeShortcut}
 from "@/modules/placements/recruiter-change-shortcuts-model";
describe("Recruiter prototype change shortcuts",()=>{
 it("maps five choices to existing approved fields",()=>{
  expect(RECRUITER_CHANGE_SHORTCUTS.map(row=>row.key))
   .toEqual(["time","round","eligibility","pay","other"]);
  expect(recruiterChangeShortcut("time")?.field).toBe("ROUNDS");
  expect(recruiterChangeShortcut("eligibility")?.field).toBe("BRANCHES");
  expect(recruiterChangeShortcut("pay")?.field).toBe("CTC");
 });
 it("rejects unrecognized and repeated URL values",()=>{
  expect(recruiterChangeShortcut("../admin")).toBeNull();
  expect(recruiterChangeShortcut(["pay","other"])).toBeNull();
  expect(recruiterChangeShortcut("")).toBeNull();
 });
});