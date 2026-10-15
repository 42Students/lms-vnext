import {describe,expect,it} from "vitest";
import {publicSalaryMetricsAllowed} from "@/modules/placements/public-page/salary-privacy-model";
describe("T-S2-08 public salary k-anonymity",()=>{
 it("does not release salary from five offers to the same student",()=>{
  expect(publicSalaryMetricsAllowed(1,5)).toBe(false);
  expect(publicSalaryMetricsAllowed(4,100)).toBe(false);
  expect(publicSalaryMetricsAllowed(5,5)).toBe(true);
 });
 it("suppresses unknown or inconsistent publication population",()=>{
  expect(publicSalaryMetricsAllowed(5,null)).toBe(false);
  expect(publicSalaryMetricsAllowed(5,4)).toBe(false);
  expect(publicSalaryMetricsAllowed(6,5)).toBe(false);
 });
});
