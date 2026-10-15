import {describe,it,expect} from "vitest";
import {updateTpoGridQuery} from "@/modules/placements/tpo-grid-model";
describe("TPO spreadsheet column changes do not reset the current roster page",()=>{
 it("keeps a valid current page and filters while editing columns",()=>{
  const before=new URLSearchParams("page=8&pageSize=50&stage=HOLD&columns=student,role");
  const after=updateTpoGridQuery(before,{columns:"role"},false);
  expect(after.get("page")).toBe("8");
  expect(after.get("pageSize")).toBe("50");
  expect(after.get("stage")).toBe("HOLD");
  expect(after.get("columns")).toBe("role");
  expect(before.get("columns")).toBe("student,role");
 });
 it("still resets paging when a row filter changes",()=>{
  const after=updateTpoGridQuery(new URLSearchParams("page=8&stage=HOLD"),{stage:"SHORTLISTED"});
  expect(after.has("page")).toBe(false);
  expect(after.get("stage")).toBe("SHORTLISTED");
 });
});
