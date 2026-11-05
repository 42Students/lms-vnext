import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync("src/components/projects/project-participant-list-controls.tsx","utf8");
describe("Mentor projects directory responsive filters and paging",()=>{
 it("UX-mentor-cross-X01 uses minimum 44px controls and 16px input fonts on phones",()=>{
  expect(source).not.toContain("min-w-60");
  expect(source).not.toContain("text-sm font-normal text-foreground");
  expect(source).toContain('className="min-h-11 w-full min-w-0 max-w-full text-base');
  expect(source).toContain("text-base font-normal text-foreground");
  expect(source).toContain('<Button type="submit" className="min-h-11 w-full');
  expect(source).toContain('<ButtonLink variant="secondary"');
  expect(source).toContain('className="w-full"');
  expect(readFileSync("src/components/ui/button.tsx","utf8")).toContain("min-h-11");
 });
 it("UX-mentor-cross-X02 hides inaccessible disabled pagination links from tab order",()=>{
  expect(source).toContain("tabIndex={page <= 1 ? -1 : undefined}");
  expect(source).toContain("tabIndex={page >= totalPages ? -1 : undefined}");
  expect(source).toContain("aria-disabled={page <= 1}");
  expect(source).toContain("href={href(");
 });
});
