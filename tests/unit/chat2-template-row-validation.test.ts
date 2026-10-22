import {describe,expect,it} from "vitest";
import {legacyUntitledTemplateRowError} from "@/modules/projects/template-row-validation-model";

describe("G2-7-013-030 legacy repeated template item validation",()=>{
 it("uses the exact indexed title error within the first invalid section",()=>{
  expect(legacyUntitledTemplateRowError([
   [{title:"First release"}],[{title:"Sprint 1"}],
   [{title:"Task 1"},{title:"  "},{title:"Task 3"}],
  ])).toBe("Item 2: Title required");
 });
 it("starts counting again in each section",()=>{
  expect(legacyUntitledTemplateRowError([
   [{title:"Release"}],[{title:""}],[{title:"Task"}],
  ])).toBe("Item 1: Title required");
 });
 it("allows every row with a nonempty title",()=>{
  expect(legacyUntitledTemplateRowError([[{title:"One"}],[{title:"Two"}]]))
   .toBeNull();
 });
});
