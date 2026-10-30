import {describe,expect,it} from "vitest";
import {facultyBlueprintFullContentOrder} from "@/modules/courses/faculty-blueprint-full-content-order";

const lesson=[
 {id:"shared-1",contentOrderMember:true,reorderable:false},
 {id:"own-1",contentOrderMember:true,reorderable:true},
 {id:"quiz",contentOrderMember:false,reorderable:false},
 {id:"shared-2",contentOrderMember:true,reorderable:false},
 {id:"own-2",contentOrderMember:true,reorderable:true},
 {id:"own-3",contentOrderMember:true,reorderable:true},
 {id:"assignment",contentOrderMember:false,reorderable:false},
];
describe("Faculty Blueprint exact-set ordering with shared syllabus items",()=>{
 it("submits the complete visible content set, keeping shared items anchored and omitting assessments",()=>{
  expect(facultyBlueprintFullContentOrder(lesson,["own-3","own-1","own-2"]))
   .toEqual(["shared-1","own-3","shared-2","own-1","own-2"]);
 });
 it("preserves single and empty lessons without introducing foreign IDs",()=>{
  expect(facultyBlueprintFullContentOrder(lesson,["own-1","own-2","own-3"]))
   .toEqual(["shared-1","own-1","shared-2","own-2","own-3"]);
  expect(facultyBlueprintFullContentOrder([],[])).toEqual([]);
 });
 it("fails closed on stale, duplicate, injected, or incomplete Section-owned IDs",()=>{
  for(const ids of [
   ["own-1","own-2"],["own-1","own-2","foreign"],
   ["own-1","own-1","own-3"],["own-1","own-2","own-3","own-4"],
  ])expect(()=>facultyBlueprintFullContentOrder(lesson,ids)).toThrow("reload the lesson");
  expect(()=>facultyBlueprintFullContentOrder([
   {id:"shared",contentOrderMember:true,reorderable:false},
   {id:"shared",contentOrderMember:true,reorderable:false},
  ],[])).toThrow("reload the lesson");
 });
});
