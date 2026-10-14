import {describe,expect,it} from "vitest";
import {learnerDashboardMetricView} from "@/modules/placements/learner-dashboard-metric-view-model";
describe("learner dashboard unknown versus real zero",()=>{
 it("does not present failed sources as a numeric zero",()=>{
  const value=learnerDashboardMetricView(null,"Upcoming interviews","View all");
  expect(value.display).toBe("Unknown");
  expect(value.unavailable).toBe(true);
  expect(value.ariaLabel).toBe("Upcoming interviews: unavailable");
  expect(value.detail).toContain("retry");
 });
 it("preserves an authorized real zero and positive count",()=>{
  expect(learnerDashboardMetricView(0,"Applications","View all")).toMatchObject({
    display:"0",unavailable:false,ariaLabel:"Applications: 0"
  });
  expect(learnerDashboardMetricView(9,"Applications","View all").display).toBe("9");
 });
});
