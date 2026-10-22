import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const files=["src/components/announcements/announcement-admin-workspace.tsx","src/components/admin/college-admin-lifecycle-action.tsx","src/components/admin/college-feature-rule-editor.tsx","src/components/admin/student-rule-editor.tsx","src/components/admin/college-branding-form.tsx"];
describe("UX-admin first-third delegated child controls",()=>{
 it("keeps announcement links in the same WebView tab and uses shared Select",()=>{const s=readFileSync(files[0],"utf8");const tabs=s.match(/target="_blank"/g)??[];
  const safe=s.match(/rel="noopener noreferrer"/g)??[];
  expect(tabs.length).toBeGreaterThan(0);
  expect(tabs.length).toBe(safe.length);
  expect(s).not.toContain("min-h-10");expect(s).toContain("<Select");});
 it("makes college-admin suspension a labeled 44px action with shared Input",()=>{const s=readFileSync(files[1],"utf8");expect(s).toContain("<Input");expect(s).toContain('<Button type="button"');expect(s).not.toContain("min-h-10");});
 it("uses shared 44px selects for scoped student/college policy editors",()=>{for(const path of files.slice(2,4)){const s=readFileSync(path,"utf8");expect(s).toContain("<Select");expect(s).not.toContain("<select");}});
 it("preserves contrast and touch-safe sign-in preview",()=>{const s=readFileSync(files[4],"utf8");expect(s).toContain("mt-3 flex min-h-11");expect(s).not.toContain("text-primary-text");});
});
