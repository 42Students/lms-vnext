import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const sqlSource=readFileSync(new URL("../../src/modules/placements/tpo-audit-service.ts",import.meta.url),"utf8");
describe("TPO-settings-audit-91 canonical human detail, without raw metadata",()=>{
 it("projects the persisted summary instead of generic placeholders",()=>{
  expect(sqlSource).toContain("nullif(trim(ae.summary),'')");
  expect(sqlSource).toContain("PLACEMENTS_COLLEGE_RULES_UPDATED");
  expect(sqlSource).toContain("PLACEMENTS_SEASON_DETAILS_UPDATED");
  expect(sqlSource).toContain("ae.metadata->'to'->>'maxHeldOffers'");
  expect(sqlSource).toContain("ae.metadata->'after'->>'endDate'");
 });
 it("never exports arbitrary metadata or free-text reasons",()=>{
  expect(sqlSource).not.toContain("ae.metadata as detail");
  expect(sqlSource).not.toContain("history.reason as detail");
  expect(sqlSource).not.toContain("ae.metadata::text as detail");
 });
});
