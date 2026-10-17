import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {publicPlacementContentInput,formatPublicPlacementMetric,
 DEFAULT_PUBLIC_METRICS,PUBLIC_METRIC_LABELS} from "@/modules/placements/public-page/content-model";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Public placements editorial content and selected numbers",()=>{
 it("TPO-campaigns-public-33 supports audited, college-scoped About content, max 4000 chars and preview",()=>{
  const form=src("src/components/placements/tpo-public-placement-content-editor.tsx");
  const service=src("src/modules/placements/public-page/content-service.ts");
  const publicPage=src("src/app/placements/page.tsx");
  expect(form).toContain("About your placements");
  expect(form).toContain('maxLength={4000}');
  expect(service).toContain('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  expect(publicPage).toContain("whitespace-pre-wrap");
  expect(publicPlacementContentInput.safeParse({about:"hello",metricKeys:DEFAULT_PUBLIC_METRICS,expectedUpdatedAt:null}).success).toBe(true);
  expect(publicPlacementContentInput.safeParse({about:"x".repeat(4001),metricKeys:DEFAULT_PUBLIC_METRICS,expectedUpdatedAt:null}).success).toBe(false);
 });
 it("TPO-campaigns-public-34 lets TPO choose and order all seven numbers, with privacy fallback and LPA",()=>{
  expect(Object.keys(PUBLIC_METRIC_LABELS)).toHaveLength(7);
  expect(publicPlacementContentInput.safeParse({
   about:"",metricKeys:["MEDIAN_CTC","STUDENTS","PLACED"],expectedUpdatedAt:null,
  }).success).toBe(true);
  expect(publicPlacementContentInput.safeParse({
   about:"",metricKeys:["PLACED","PLACED"],expectedUpdatedAt:null,
  }).success).toBe(false);
  expect(formatPublicPlacementMetric("PERCENT",{population:100,placed:23,offers:8,
   employers:5,highestCtcInr:1000000,medianCtcInr:650000})).toBe("23%");
  expect(formatPublicPlacementMetric("HIGHEST_CTC",{population:100,placed:23,offers:8,
   employers:5,highestCtcInr:1000000,medianCtcInr:650000})).toBe("10.0 LPA");
  const publicPage=src("src/app/placements/page.tsx");
  expect(publicPage).toContain("metricKeys.map(key");
  expect(publicPage).toContain("Live numbers over the last 12 months.");
 });
 it("TPO-campaigns-public-34 does not confuse withheld population with zero",()=>{
  expect(formatPublicPlacementMetric("STUDENTS",{population:null,placed:null,offers:null,
   employers:null,highestCtcInr:null,medianCtcInr:null})).toBe("(not enough data yet)");
 });
});
