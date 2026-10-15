import {expect,it} from "vitest";
import {facultyContentOrderValid} from "@/modules/courses/faculty-content-order-ui-model";
it("refuses forged, duplicated or missing lesson content in an order write",()=>{
 expect(facultyContentOrderValid(["a","b","c"],["c","a","b"])).toBe(true);
 expect(facultyContentOrderValid(["a","b"],["a","a"])).toBe(false);
 expect(facultyContentOrderValid(["a","b"],["a","c"])).toBe(false);
 expect(facultyContentOrderValid(["a","b"],["a"])).toBe(false);
 expect(facultyContentOrderValid(["a","a"],["a","a"])).toBe(false);
});
