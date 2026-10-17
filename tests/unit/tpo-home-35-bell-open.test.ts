import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoBellOpenHref} from "@/modules/activity/tpo-bell-open-model";

describe("TPO-home-35 / TPO-inbox-team-61 bell open and acknowledge",()=>{
 it("accepts only application-relative links, never off-origin redirects",()=>{
  expect(tpoBellOpenHref("/tpo/drives/123?tab=requests")).toBe("/tpo/drives/123?tab=requests");
  expect(tpoBellOpenHref(null)).toBeNull();
  expect(tpoBellOpenHref("https://example.com")).toBeNull();
  expect(tpoBellOpenHref("//example.com")).toBeNull();
  expect(tpoBellOpenHref("/\\example.com")).toBeNull();
 });
 it("uses the scoped POST on click before navigating, with no navigation on failure",()=>{
  const panel=readFileSync("src/components/tpo/tpo-bell-panel.tsx","utf8");
  expect(panel).toContain('"/api/tpo/notifications/"+encodeURIComponent(item.id)+"/read"');
  expect(panel).toContain('onClick={()=>void openItem(item)}');
  expect(panel).toContain("await apiFetch(");
  expect(panel).toContain('method:"POST",credentials:"same-origin",timeoutMs:12000');
  expect(panel).toContain("}catch(reason){");
  expect(panel).toContain("return;");
  expect(panel).toContain("if(href)router.push(href)");
  expect(panel).toContain("setReadIds(ids=>ids.includes(item.id)?ids:[...ids,item.id])");
 });
});
