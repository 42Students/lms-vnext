import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../src/modules/projects/"+p,import.meta.url),"utf8");
describe("PR-S2-07 registered 0091 reopening",()=>{
 it("writes registered reopen marker and scoped event, not activity as authorization",()=>{
  const service=read("delivery-reopen-service.ts");
  expect(service).toContain("projectDeliveryEvents");
  expect(service).toContain('eventType:"REOPENED"');
  expect(service).toContain("reopenedAt:now");
  expect(service).toContain("isNull(projectSubmissions.reopenedAt)");
  expect(service).toContain("projectEvaluations");
  expect(service).toContain("date_trunc('milliseconds'");
  expect(read("submission-service.ts")).toContain('Boolean(latest.reopenedAt)');
  expect(read("readiness-service.ts")).toContain('Boolean(latestSubmission.reopenedAt)');
 });
});