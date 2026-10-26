import {describe,it,expect} from "vitest";
import {orderFacultyBlueprintItems} from "../../src/modules/courses/faculty-blueprint-sort-model";

describe("Faculty Blueprint mixed lesson-item ordering",()=>{
 it("interleaves shared resource, assignment, class video and quiz by persisted sequence",()=>{
  const original=[
   {id:"content-1",sequence:1,kind:"RESOURCE"},
   {id:"video-4",sequence:4,kind:"VIDEO"},
   {id:"assignment-2",sequence:2,kind:"ASSIGNMENT"},
   {id:"quiz-3",sequence:3,kind:"QUIZ"},
  ];
  expect(orderFacultyBlueprintItems(original).map(item=>item.id))
   .toEqual(["content-1","assignment-2","quiz-3","video-4"]);
  // No mutation of the server-read arrays that may be used in other tabs.
  expect(original.map(item=>item.id))
   .toEqual(["content-1","video-4","assignment-2","quiz-3"]);
 });
 it("preserves source-table encounter order for historic cross-table sequence ties",()=>{
  const original=[
   {id:"resource",sequence:1},
   {id:"assignment",sequence:1},
   {id:"quiz",sequence:1},
  ];
  expect(orderFacultyBlueprintItems(original).map(item=>item.id))
   .toEqual(["resource","assignment","quiz"]);
 });
 it("supports empty lessons without producing fake content",()=>{
  expect(orderFacultyBlueprintItems([])).toEqual([]);
 });
});
