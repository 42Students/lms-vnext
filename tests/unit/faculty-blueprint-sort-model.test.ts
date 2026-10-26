import {describe,it,expect} from "vitest";
import {orderFacultyBlueprintItems,orderFacultyBlueprintContentSlots} from "../../src/modules/courses/faculty-blueprint-sort-model";

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

describe("Faculty Blueprint authoritative Section content order",()=>{
 it("does not re-sort a saved class override by historical content sequence",()=>{
  const content=[
   {id:"c3",sequence:3,kind:"VIDEO"},
   {id:"c1",sequence:1,kind:"RESOURCE"},
  ];
  const assessments=[{id:"a2",sequence:2,kind:"ASSIGNMENT"},
   {id:"q4",sequence:4,kind:"QUIZ"}];
  expect(orderFacultyBlueprintContentSlots(content,assessments).map(x=>x.id))
   .toEqual(["c3","a2","c1","q4"]);
  expect(content.map(x=>x.id)).toEqual(["c3","c1"]);
 });
 it("preserves mixed assessment slots and includes shared contents",()=>{
  const content=[{id:"owned-4",sequence:4},{id:"shared-1",sequence:1},
   {id:"owned-2",sequence:2}];
  const assessments=[{id:"quiz-3",sequence:3}];
  expect(orderFacultyBlueprintContentSlots(content,assessments).map(x=>x.id))
   .toEqual(["owned-4","shared-1","quiz-3","owned-2"]);
  expect(orderFacultyBlueprintContentSlots([],assessments)).toEqual(assessments);
 });
});
