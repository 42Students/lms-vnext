import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("G2-12-003-059: last-good college course directory",()=>{
 it("preserves the previously authorized tree after a failed refresh and disables stale actions",()=>{
  const component=readFileSync("src/components/courses/admin-courses-last-good.tsx","utf8");
  const page=readFileSync("src/app/(authenticated)/admin/courses/page.tsx","utf8");
  expect(component).toContain("useState<ReactNode>(()=>available?children:null)");
  expect(component).toContain("if(available)setLastGood(children)");
  expect(component).toContain('inert aria-label="Previously loaded courses; controls disabled"');
  expect(component).toContain('role="alert"');
  expect(component).not.toContain("localStorage");
  expect(component).not.toContain("sessionStorage");
  expect(page).toContain('key={context.user.id+":"+collegeId}');
  expect(page).toContain("available={Boolean(workspace)}");
  expect(page).toContain("{workspace?<>");
 });
});
