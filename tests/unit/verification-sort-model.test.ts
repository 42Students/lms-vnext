import {describe,expect,it} from "vitest";
import {verificationSortDirection} from "@/modules/verification/sort-model";
describe("verification stable sort order",()=>{it("maps newest and oldest explicitly",()=>{
 expect(verificationSortDirection("OLDEST")).toBe("ascending");
 expect(verificationSortDirection("NEWEST")).toBe("descending");
});});
