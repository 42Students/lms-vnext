import {expect,it} from "vitest";
import {facultyContentOrderReceiptMatches} from "@/modules/courses/faculty-content-order-ui-model";
it("requires exact persisted content ids, positions and current teaching Section",()=>{
 const rows=[{lessonContentId:"b",deliveryId:"section-1",sequence:0},{lessonContentId:"a",deliveryId:"section-1",sequence:1}];
 expect(facultyContentOrderReceiptMatches("section-1",["b","a"],{order:rows})).toBe(true);
 expect(facultyContentOrderReceiptMatches("section-2",["b","a"],{order:rows})).toBe(false);
 expect(facultyContentOrderReceiptMatches("section-1",["a","b"],{order:rows})).toBe(false);
 expect(facultyContentOrderReceiptMatches("section-1",["b","a"],{order:[rows[0]]})).toBe(false);
 expect(facultyContentOrderReceiptMatches("section-1",["b","a"],null)).toBe(false);
});
