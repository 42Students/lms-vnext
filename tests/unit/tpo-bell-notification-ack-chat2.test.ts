import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO notification click acknowledgement",()=>{
 it("TPO-inbox-team-64 and GR-71 only navigate after a successful bounded acknowledgement",()=>{
  const component=src("src/components/activity/notification-list.tsx");
  expect(component).toContain("await apiFetch(readEndpoint +");
  expect(component).toContain("timeoutMs: 12000");
  expect(component).toContain("if (acknowledged && openHref) router.push(openHref)");
  expect(component).toContain("else if (acknowledged) router.refresh()");
  expect(component).not.toContain("if (openHref) {\n        // A failed acknowledgement");
  expect(component).toContain("Could not mark this notification as read");
  expect(component).toContain('variant==="tpo"?<button');
 });
 it("TPO-inbox-team-61 keeps notification bell routing dependent on successful POST",()=>{
  const bell=src("src/components/tpo/tpo-bell-panel.tsx");
  expect(bell).toContain("await apiFetch(");
  expect(bell).toContain("setOpen(false)");
  expect(bell).toContain("if(href)router.push(href)");
  expect(bell).toContain("timeoutMs:12000");
 });
});
