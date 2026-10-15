import {describe,expect,it} from "vitest";
import {normalizeTpoFinderTerm} from "@/modules/placements/tpo-find-query-model";
describe("T-S2-01 TPO finder literals",()=>{
 it("normalizes without widening percent/underscore into wildcards",()=>{
  expect(normalizeTpoFinderTerm("  AcMe  ")).toBe("acme");
  expect(normalizeTpoFinderTerm("A_B%")).toBe("a_b%");
 });
 it("rejects empty or overlong input",()=>{
  expect(()=>normalizeTpoFinderTerm(" ")).toThrow();
  expect(()=>normalizeTpoFinderTerm("x".repeat(101))).toThrow();
 });
});
