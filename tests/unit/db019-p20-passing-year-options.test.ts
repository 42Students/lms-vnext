import {describe,expect,it} from "vitest";
import {legacyPassingYearOptions} from "@/modules/placements/tpo-after-college-model";

describe("DB19-P20 passing-year source choice fidelity",()=>{
 it("accepts real years, deduplicates and preserves the legacy string order",()=>{
  expect(legacyPassingYearOptions([2027,"2026","2025",2026,null,"2027"]))
   .toEqual([
    {value:"2025",label:"2025"},
    {value:"2026",label:"2026"},
    {value:"2027",label:"2027"},
   ]);
 });
 it("rejects malformed, negative and partial years instead of leaking selector values",()=>{
  expect(legacyPassingYearOptions([
   "2026-27","26","02026","2026a","0","\u005c\u005cd{4}","-999","NaN",null,2028,
  ])).toEqual([{value:"2028",label:"2028"}]);
 });
});
