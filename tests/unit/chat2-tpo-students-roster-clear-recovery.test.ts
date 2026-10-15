import {describe,it,expect} from "vitest";
import {tpoStudentRosterClearHref} from "../../src/modules/placements/tpo-student-roster-clear-model";
describe("TPO student roster filtered-empty recovery",()=>{
 it("preserves safe display density and column layout on reset",()=>{
  const url=new URL(tpoStudentRosterClearHref(50,"name,branch"),"http://localhost");
  expect(url.searchParams.get("pageSize")).toBe("50");
  expect(url.searchParams.get("columns")).toBe("name,branch");
  expect(url.searchParams.has("journeyState")).toBe(false);
  expect(url.searchParams.has("search")).toBe(false);
 });
 it("does not forward unknown page sizes or stale pagination",()=>{
  const url=new URL(tpoStudentRosterClearHref(999),"http://localhost");
  expect(url.searchParams.has("pageSize")).toBe(false);
  expect(url.searchParams.has("page")).toBe(false);
 });
});
