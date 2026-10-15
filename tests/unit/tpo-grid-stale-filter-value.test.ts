import {describe,it,expect} from "vitest";
import {invalidTpoGridFilterValue,resolvedTpoGridFilterValue} from "@/modules/placements/tpo-grid-filter-state";
const field={allValue:"ALL",options:[{value:"PLACED",label:"Placed"},{value:"APPLYING",label:"Applying"}]};
describe("TPO grid stale saved-filter feedback",()=>{
 it("does not assign a nonexistent option to the select",()=>{
  expect(invalidTpoGridFilterValue("REMOVED_STAGE",field)).toBe(true);
  expect(resolvedTpoGridFilterValue("REMOVED_STAGE",field)).toBe("ALL");
 });
 it("keeps valid and unset filters stable",()=>{
  expect(invalidTpoGridFilterValue("PLACED",field)).toBe(false);
  expect(resolvedTpoGridFilterValue("PLACED",field)).toBe("PLACED");
  expect(resolvedTpoGridFilterValue(null,field)).toBe("ALL");
  expect(resolvedTpoGridFilterValue("",field)).toBe("ALL");
 });
});
