import {describe,expect,it} from "vitest";
import {facultyMoveContentId,facultyContentOrderDirty,facultyContentOrderValid,
 facultyContentOrderReceiptMatches} from "../../src/modules/courses/faculty-content-order-ui-model";

const a="a",b="b",c="c";
describe("Faculty Blueprint content ordering",()=>{
 it("reorders adjacent owned content and respects both boundaries",()=>{
  expect(facultyMoveContentId([a,b,c],1,-1)).toEqual([b,a,c]);
  expect(facultyMoveContentId([a,b,c],0,-1)).toEqual([a,b,c]);
  expect(facultyMoveContentId([a,b,c],2,1)).toEqual([a,b,c]);
 });
 it("detects changes without misclassifying identical orders",()=>{
  expect(facultyContentOrderDirty([a,b],[a,b])).toBe(false);
  expect(facultyContentOrderDirty([a,b],[b,a])).toBe(true);
 });
 it("rejects foreign or repeated content ids",()=>{
  expect(facultyContentOrderValid([a,b],[b,a])).toBe(true);
  expect(facultyContentOrderValid([a,b],[a,a])).toBe(false);
  expect(facultyContentOrderValid([a,b],[a,"foreign"])).toBe(false);
 });
 it("rejects bogus successful receipts and wrong delivery or order",()=>{
  const ids=[a,b];
  const expected={order:[
   {lessonContentId:a,deliveryId:"delivery",sequence:0},
   {lessonContentId:b,deliveryId:"delivery",sequence:1},
  ]};
  expect(facultyContentOrderReceiptMatches("delivery",ids,expected)).toBe(true);
  expect(facultyContentOrderReceiptMatches("other",ids,expected)).toBe(false);
  expect(facultyContentOrderReceiptMatches("delivery",ids,{order:[...expected.order].reverse()})).toBe(false);
 });
});