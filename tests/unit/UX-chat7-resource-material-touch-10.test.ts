import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {safeLearnerResourceMaterialHref} from "@/modules/courses/lesson-resource-materials-model";

describe("UX-LEARN-RESOURCE-10 mobile and keyboard resource material workflow",()=>{
 it("keeps all interactive material inputs and actions at least 44px high",()=>{
  const source=readFileSync("src/components/courses/lesson-resource-materials-control.tsx","utf8");
  expect(source).toContain('className="inline-flex min-h-11 items-center text-xs font-semibold text-primary-text underline');
  expect(source).toContain('className="min-h-11 md:min-h-9" disabled={busy}');
  expect(source.match(/className="min-h-11 md:min-h-9"/g)?.length).toBeGreaterThanOrEqual(4);
  expect(source).not.toContain("min-h-10");
 });
 it("preserves reply-safe authoring confirmation, inline error and cancel states",()=>{
  const source=readFileSync("src/components/courses/lesson-resource-materials-control.tsx","utf8");
  expect(source).toContain('title="Remove this material?" description="Students will no longer see it."');
  expect(source).toContain('<ConfirmDialog open={removeId!==null}');
  expect(source).toContain('pending={busy} onConfirm=');
  expect(source).toContain("Could not save resource material. Check your permissions and try again.");
  expect(source).toContain("Cancel edit");
  expect(source).toContain('<Alert tone="error">{error}</Alert>');
  expect(source).toContain('role="status"');
 });
 it("never opens malicious historical links in an accessible learner material surface",()=>{
  expect(safeLearnerResourceMaterialHref("javascript:alert(1)")).toBeNull();
  expect(safeLearnerResourceMaterialHref("https://localhost/admin")).toBeNull();
  expect(safeLearnerResourceMaterialHref("https://university.example.edu/docs"))
   .toBe("https://university.example.edu/docs");
 });
});
