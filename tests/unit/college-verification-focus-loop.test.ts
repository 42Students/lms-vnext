import {describe,it,expect} from "vitest";
import {verificationFocusWrap} from "@/modules/verification/review-focus-loop";
describe("Staff verification drawer focus boundaries",()=>{
 it("wraps forward Tab at the last focus target",()=>{
  expect(verificationFocusWrap(false,true,false)).toBe("FIRST");
  expect(verificationFocusWrap(true,false,false)).toBeNull();
 });
 it("wraps Shift+Tab from the first target and preserves interior focus",()=>{
  expect(verificationFocusWrap(true,false,true)).toBe("LAST");
  expect(verificationFocusWrap(false,false,true)).toBeNull();
 });
});
