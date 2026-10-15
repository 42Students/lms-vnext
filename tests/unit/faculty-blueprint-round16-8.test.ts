import {expect,it} from "vitest";
import {facultyContentOrderDirty} from "@/modules/courses/faculty-content-order-ui-model";
it("enables save only when the visible content order changed",()=>{
 expect(facultyContentOrderDirty(["a","b"],["a","b"])).toBe(false);
 expect(facultyContentOrderDirty(["a","b"],["b","a"])).toBe(true);
 expect(facultyContentOrderDirty(["a","b"],["a"])).toBe(true);
 expect(facultyContentOrderDirty([],[])).toBe(false);
});
